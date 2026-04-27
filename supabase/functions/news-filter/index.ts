// supabase/functions/news-filter/index.ts
// Stage 2 of the news pipeline. Pulls up to 20 'pending' news_candidates,
// runs each through the editorial rubric (Sonnet, temperature 0.3), and
// writes back a filter decision: ready | rejected | duplicate.
//
// Sequential — Anthropic rate limits will refuse parallel bursts.

import { createServiceClient } from '../_shared/supabase-client.ts';
import { isServiceRoleBearer } from '../_shared/auth.ts';
import { callAIJson } from '../_shared/news-ai.ts';
import { RUBRIC_SYSTEM_PROMPT } from './rubric.ts';
import {
  resolveCompanies,
  resolveExecutives,
  resolveSectors,
  resolveTickers,
} from './entity-resolver.ts';
import type {
  CandidateRow,
  ContextRow,
  FilterAIResponse,
  FilterResult,
} from './types.ts';

const BATCH_SIZE = 20;
const VALID_CATEGORIES = new Set([
  'markets', 'deals', 'leadership', 'ai', 'startups', 'regulation', 'opinion',
]);

type Client = ReturnType<typeof createServiceClient>;

Deno.serve(async (req) => {
  if (!isServiceRoleBearer(req.headers.get('Authorization'))) {
    return json({ error: 'unauthorised' }, 401);
  }

  const client = createServiceClient();

  // 1. Pull pending candidates ordered by priority/recency.
  const { data: pendingRaw, error } = await client
    .from('news_candidates')
    .select('id, source_title, source_url, source_summary, source_pub_date, source_feed, status, priority_score')
    .eq('status', 'pending')
    .order('priority_score', { ascending: false, nullsFirst: false })
    .order('source_pub_date', { ascending: false, nullsFirst: false })
    .limit(BATCH_SIZE);

  if (error) return json({ error: error.message }, 500);
  const pending = (pendingRaw ?? []) as CandidateRow[];

  // 2. Build context block (recent articles + recent candidates).
  const context = await buildContext(client);
  const contextBlock = formatContext(context);

  const result: FilterResult = {
    processed: 0,
    ready: 0,
    rejected: 0,
    duplicate: 0,
    failed: 0,
    errors: [],
  };

  // 3. Sequential per-candidate Sonnet calls.
  for (const candidate of pending) {
    result.processed++;
    try {
      const userMsg = buildUserMessage(candidate, contextBlock);
      const decision = await callAIJson<FilterAIResponse>({
        model: 'sonnet',
        system: RUBRIC_SYSTEM_PROMPT,
        user: userMsg,
        max_tokens: 800,
        temperature: 0.3,
      });

      const normalised = normalise(decision);
      const entityIds = await resolveEntities(client, normalised);

      const newStatus =
        normalised.decision === 'approve' ? 'ready'
        : normalised.decision === 'duplicate' ? 'duplicate'
        : 'rejected';

      const reason = normalised.decision === 'duplicate' && normalised.duplicate_of_title
        ? `${normalised.reason} (duplicate of: ${normalised.duplicate_of_title.slice(0, 200)})`
        : normalised.reason;

      const { error: updateError } = await client
        .from('news_candidates')
        .update({
          status: newStatus,
          priority_score: normalised.priority,
          suggested_category: VALID_CATEGORIES.has(normalised.category) ? normalised.category : null,
          suggested_companies: entityIds.companies,
          suggested_tickers: entityIds.tickers,
          suggested_executives: entityIds.executives,
          suggested_sectors: entityIds.sectors,
          rejection_reason: reason,
        })
        .eq('id', candidate.id);

      if (updateError) {
        result.failed++;
        result.errors.push({ candidate_id: candidate.id, message: `update: ${updateError.message}` });
        continue;
      }

      if (newStatus === 'ready') result.ready++;
      else if (newStatus === 'duplicate') result.duplicate++;
      else result.rejected++;
    } catch (err) {
      result.failed++;
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ candidate_id: candidate.id, message: msg });
      // Leave at 'pending' for next run.
    }
  }

  return json(result, 200);
});


// ---------- helpers ----------

async function buildContext(client: Client): Promise<ContextRow[]> {
  const [articles, candidates] = await Promise.all([
    client
      .from('articles')
      .select('title, category')
      .gte('published_at', `${new Date(Date.now() - 3 * 86400_000).toISOString()}`)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50),
    client
      .from('news_candidates')
      .select('source_title, suggested_category')
      .gte('created_at', `${new Date(Date.now() - 3 * 86400_000).toISOString()}`)
      .in('status', ['ready', 'published'])
      .limit(50),
  ]);

  const rows: ContextRow[] = [];
  // deno-lint-ignore no-explicit-any
  for (const r of (articles.data ?? []) as any[]) {
    rows.push({ title: r.title, category: r.category ?? 'unknown' });
  }
  // deno-lint-ignore no-explicit-any
  for (const r of (candidates.data ?? []) as any[]) {
    rows.push({ title: r.source_title, category: r.suggested_category ?? 'unknown' });
  }
  return rows;
}

function formatContext(rows: ContextRow[]): string {
  if (!rows.length) return '(no recent articles or approved candidates in the last 3 days)';
  return rows.map((r) => `- [${r.category}] ${r.title}`).join('\n');
}

function buildUserMessage(c: CandidateRow, contextBlock: string): string {
  const pubDate = c.source_pub_date ?? 'unknown';
  const url = c.source_url ?? '(none)';
  const summary = c.source_summary ?? '(none)';
  return `# Candidate

Title:    ${c.source_title}
URL:      ${url}
Pub date: ${pubDate}

Summary:
${summary}

# Recent context (last 3 days, ${contextBlock.split('\n').length} items)

${contextBlock}

Decide: approve / reject / duplicate. Output the JSON object exactly as specified.`;
}

function normalise(d: FilterAIResponse): FilterAIResponse {
  return {
    decision: (['approve', 'reject', 'duplicate'].includes(d.decision) ? d.decision : 'reject') as FilterAIResponse['decision'],
    reason: typeof d.reason === 'string' ? d.reason.slice(0, 500) : '',
    category: typeof d.category === 'string' ? d.category.toLowerCase() : '',
    companies: Array.isArray(d.companies) ? d.companies.filter((x): x is string => typeof x === 'string') : [],
    tickers: Array.isArray(d.tickers) ? d.tickers.filter((x): x is string => typeof x === 'string') : [],
    executives: Array.isArray(d.executives) ? d.executives.filter((x): x is string => typeof x === 'string') : [],
    sectors: Array.isArray(d.sectors) ? d.sectors.filter((x): x is string => typeof x === 'string') : [],
    priority: clamp(typeof d.priority === 'number' ? d.priority : 0, 0, 100),
    duplicate_of_title: typeof d.duplicate_of_title === 'string' ? d.duplicate_of_title : undefined,
  };
}

interface ResolvedEntities {
  companies: string[];
  tickers: string[];
  executives: string[];
  sectors: string[];
}

async function resolveEntities(client: Client, d: FilterAIResponse): Promise<ResolvedEntities> {
  const [companies, tickers, executives, sectors] = await Promise.all([
    resolveCompanies(client, d.companies),
    resolveTickers(client, d.tickers),
    resolveExecutives(client, d.executives),
    resolveSectors(client, d.sectors),
  ]);
  return { companies, tickers, executives, sectors };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
