// supabase/functions/news-ingest-rss/index.ts
// Stage 1 of the news pipeline. For every active rss_feeds row whose
// last_fetched_at is older than its fetch_interval_minutes, fetch the
// feed, parse RSS 2.0 / Atom 1.0, dedupe against news_candidates, and
// insert survivors as status='pending' with full_text=NULL.
//
// Auth: explicit Bearer SUPABASE_SERVICE_ROLE_KEY header check (in
// addition to Supabase's default JWT verify).
//
// No LLM calls. No source-URL scrape. No cron wiring.
//
// Spec: see CLAUDE Code prompt 2026-04-27 for refinements over plan §3.3.

import { createServiceClient } from '../_shared/supabase-client.ts';
import { fetchWithTimeout } from '../_shared/http.ts';
import { parseFeed } from './feed-parser.ts';
import { normalise, sha256Hex } from './content-hash.ts';
import type { FeedItem, FeedRow, IngestResult } from './types.ts';

const UA = 'BusinessFortitudeBot/1.0 (+https://www.businessfortitude.com/bot)';
const FETCH_TIMEOUT_MS = 15_000;
const WINDOW_HOURS = 72;
const PUBDATE_MISSING_HEAD_LIMIT = 10;
const FAILURE_DISABLE_THRESHOLD = 10;

// Translation stub. All 19 currently seeded feeds are English. When BF
// starts ingesting non-English feeds this gets wired to a Sonnet call
// (plan §3.3); until then it's a no-op for lang === 'en' and an
// identity for everything else.
function translateIfNeeded(lang: string, text: string): string {
  if (lang === 'en') return text;
  return text;
}

type Client = ReturnType<typeof createServiceClient>;

Deno.serve(async (req) => {
  // App-level auth gate. We verify role=service_role from the bearer JWT
  // payload rather than string-matching against the auto-injected env
  // var: that var's exact value differs across legacy / sb_secret-era
  // projects, but every legitimate caller signs a JWT whose payload
  // declares role=service_role. Supabase's platform-level verify_jwt
  // (on by default) has already validated the signature by the time we
  // run, so a payload check is sufficient.
  if (!isServiceRoleBearer(req.headers.get('Authorization'))) {
    return json({ error: 'unauthorised' }, 401);
  }

  let client: Client;
  try {
    client = createServiceClient();
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }

  const { data: feeds, error } = await client
    .from('rss_feeds')
    .select('id, name, url, fetch_interval_minutes, last_fetched_at, consecutive_failure_count, is_active')
    .eq('is_active', true);

  if (error) return json({ error: error.message }, 500);

  const due = (feeds ?? []).filter(isDue) as FeedRow[];

  const result: IngestResult = {
    feeds_processed: 0,
    feeds_skipped: 0,
    items_inserted: 0,
    items_deduped: 0,
    errors: [],
  };

  for (const feed of due) {
    const locked = await tryLockFeed(client, feed);
    if (!locked) {
      result.feeds_skipped++;
      continue;
    }
    result.feeds_processed++;
    try {
      await ingestFeed(client, feed, result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ feed_id: feed.id, feed_name: feed.name, message: `ingest: ${msg}` });
      // tryLockFeed already stamped last_fetched_at, but we never wrote
      // a status code. Mark as failure so this surfaces in telemetry.
      await recordFailure(client, feed, 0, `ingest: ${msg}`);
    }
  }

  return json(result, 200);
});


// ---------- helpers ----------

function isDue(f: FeedRow): boolean {
  if (f.last_fetched_at === null) return true;
  const last = new Date(f.last_fetched_at).getTime();
  if (isNaN(last)) return true;
  return Date.now() - last >= f.fetch_interval_minutes * 60 * 1000;
}

// Optimistic lock. We claim the feed by writing last_fetched_at = now()
// only if last_fetched_at is still what we just SELECTed. A concurrent
// worker that already claimed it will see 0 rows back here and skip.
async function tryLockFeed(client: Client, feed: FeedRow): Promise<boolean> {
  const newTs = new Date().toISOString();
  let q = client.from('rss_feeds')
    .update({ last_fetched_at: newTs })
    .eq('id', feed.id);
  if (feed.last_fetched_at === null) {
    q = q.is('last_fetched_at', null);
  } else {
    q = q.eq('last_fetched_at', feed.last_fetched_at);
  }
  const { data, error } = await q.select('id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

async function recordFailure(client: Client, feed: FeedRow, statusCode: number, message: string) {
  const newCount = feed.consecutive_failure_count + 1;
  const update: Record<string, unknown> = {
    last_status_code: statusCode,
    last_error: message,
    consecutive_failure_count: newCount,
  };
  if (newCount >= FAILURE_DISABLE_THRESHOLD) {
    update.is_active = false;
  }
  await client.from('rss_feeds').update(update).eq('id', feed.id);
}

async function recordSuccess(client: Client, feedId: string, statusCode: number) {
  await client.from('rss_feeds').update({
    last_status_code: statusCode,
    last_error: null,
    consecutive_failure_count: 0,
  }).eq('id', feedId);
}

function withinWindow(items: FeedItem[]): FeedItem[] {
  const cutoff = Date.now() - WINDOW_HOURS * 3600 * 1000;
  const out: FeedItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.pubDate) {
      if (it.pubDate.getTime() >= cutoff) out.push(it);
    } else if (i < PUBDATE_MISSING_HEAD_LIMIT) {
      out.push(it);
    }
  }
  return out;
}

async function ingestFeed(client: Client, feed: FeedRow, result: IngestResult): Promise<void> {
  let response: Response;
  try {
    response = await fetchWithTimeout(feed.url, { ua: UA, timeoutMs: FETCH_TIMEOUT_MS });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await recordFailure(client, feed, 0, msg);
    result.errors.push({ feed_id: feed.id, feed_name: feed.name, message: msg });
    return;
  }

  if (!response.ok) {
    const msg = `http: ${response.status}`;
    await recordFailure(client, feed, response.status, msg);
    result.errors.push({ feed_id: feed.id, feed_name: feed.name, message: msg });
    return;
  }

  let body: string;
  try {
    body = await response.text();
  } catch (err) {
    const msg = `body: ${err instanceof Error ? err.message : String(err)}`;
    await recordFailure(client, feed, response.status, msg);
    result.errors.push({ feed_id: feed.id, feed_name: feed.name, message: msg });
    return;
  }

  let parsed;
  try {
    parsed = parseFeed(body);
  } catch (err) {
    const msg = `parse: ${err instanceof Error ? err.message : String(err)}`;
    await recordFailure(client, feed, response.status, msg);
    result.errors.push({ feed_id: feed.id, feed_name: feed.name, message: msg });
    return;
  }

  const eligible = withinWindow(parsed.items);

  for (const item of eligible) {
    const title = translateIfNeeded('en', item.title).trim();
    if (!title) continue;
    const summary = item.summary ? translateIfNeeded('en', item.summary) : null;
    const hash = await sha256Hex(normalise(title));

    const { error: insertError } = await client.from('news_candidates').insert({
      source_title: title,
      source_url: item.link,
      source_feed: feed.id,
      source_pub_date: item.pubDate ? item.pubDate.toISOString() : null,
      source_author: item.author,
      source_summary: summary,
      full_text: null,
      content_hash: hash,
      status: 'pending',
    });

    if (insertError) {
      // 23505 = unique_violation. Either source_url or content_hash
      // collided with an existing row — both are expected dedup paths.
      // Anything else surfaces as an ingest error.
      const code = (insertError as unknown as { code?: string }).code;
      if (code === '23505') {
        result.items_deduped++;
      } else {
        result.errors.push({
          feed_id: feed.id,
          feed_name: feed.name,
          message: `insert: ${insertError.message}`,
        });
      }
    } else {
      result.items_inserted++;
    }
  }

  // 2xx + parses (regardless of item count) clears failure state.
  await recordSuccess(client, feed.id, response.status);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Returns true iff Authorization is "Bearer <jwt>" and the JWT payload
// claims role=service_role. Does NOT verify the signature — Supabase's
// platform verify_jwt has already done that before the function runs.
function isServiceRoleBearer(header: string | null): boolean {
  if (!header) return false;
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const token = m[1].trim();
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(b64urlDecode(parts[1]));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4;
  const padded = pad ? s + '='.repeat(4 - pad) : s;
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  // Deno has atob globally.
  return new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
}
