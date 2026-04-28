// supabase/functions/news-write/index.ts
// Stage 3 of the news pipeline. Claims up to BATCH_SIZE 'ready' candidates
// via the claim_news_candidates RPC, runs a two-pass Opus draft
// (brief → article), and inserts as status='draft' with hero_image_url
// NULL — news-images picks up the gating signal from there. news-publish
// owns the final flip to 'published'; this function does NOT publish.

import { createServiceClient } from '../_shared/supabase-client.ts';
import { isServiceRoleBearer } from '../_shared/auth.ts';
import { callAIJson } from '../_shared/news-ai.ts';
import { BRIEF_PROMPT, ARTICLE_PROMPT } from './prompts.ts';
import { checkCompliance } from './compliance.ts';
import { authorForCategory } from './authors.ts';
import type {
  ArticleAIResponse,
  BriefAIResponse,
  ClaimedCandidate,
  WriteError,
  WriteResult,
} from './types.ts';

// 1 article = 2 sequential Opus calls ≈ 60-110s. Keeps us comfortably
// under the 150s edge function timeout while still drafting on every run.
const BATCH_SIZE = 1;
const WORKER_ID = 'news-write/v2';
const VALID_CATEGORIES = new Set([
  'markets', 'deals', 'leadership', 'ai', 'startups', 'regulation', 'opinion',
]);

type Client = ReturnType<typeof createServiceClient>;

Deno.serve(async (req) => {
  if (!isServiceRoleBearer(req.headers.get('Authorization'))) {
    return json({ error: 'unauthorised' }, 401);
  }

  const client = createServiceClient();

  // 1. Claim up to BATCH_SIZE candidates atomically (FOR UPDATE SKIP LOCKED).
  // Schema: claim_news_candidates(batch_size int, worker_id text).
  const { data: claimedRaw, error: claimError } = await client.rpc(
    'claim_news_candidates',
    { batch_size: BATCH_SIZE, worker_id: WORKER_ID },
  );

  if (claimError) return json({ error: `claim: ${claimError.message}` }, 500);
  const claimed = (claimedRaw ?? []) as ClaimedCandidate[];

  const result: WriteResult = {
    drafted: 0,
    errors: [],
  };

  for (const candidate of claimed) {
    try {
      const articleId = await draftOne(client, candidate, result.errors);
      if (articleId) result.drafted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ candidate_id: candidate.id, stage: 'unknown', message: msg });
      // Best-effort: revert this row to 'ready' so the next run retries.
      await client
        .from('news_candidates')
        .update({ status: 'ready', claimed_at: null, claimed_by: null })
        .eq('id', candidate.id);
    }
  }

  return json(result, 200);
});


// ---------- per-candidate workflow ----------

async function draftOne(
  client: Client,
  candidate: ClaimedCandidate,
  errors: WriteError[],
): Promise<string | null> {
  const category = pickCategory(candidate.suggested_category);

  // Pass 1: editorial brief.
  let brief: BriefAIResponse;
  try {
    brief = await callAIJson<BriefAIResponse>({
      model: 'opus',
      system: BRIEF_PROMPT,
      user: buildBriefUserMessage(candidate, category),
      max_tokens: 1500,
      temperature: 0.5,
    });
  } catch (err) {
    errors.push({ candidate_id: candidate.id, stage: 'brief', message: (err as Error).message });
    await revert(client, candidate.id);
    return null;
  }

  // Pass 2: full article.
  let article: ArticleAIResponse;
  try {
    article = await callAIJson<ArticleAIResponse>({
      model: 'opus',
      system: ARTICLE_PROMPT,
      user: buildArticleUserMessage(candidate, category, brief),
      max_tokens: 4000,
      temperature: 0.7,
    });
  } catch (err) {
    errors.push({ candidate_id: candidate.id, stage: 'article', message: (err as Error).message });
    await revert(client, candidate.id);
    return null;
  }

  // Compliance.
  const compliance = checkCompliance(article.body_md ?? '');
  if (!compliance.ok) {
    errors.push({
      candidate_id: candidate.id,
      stage: 'compliance',
      message: `compliance hits: ${compliance.hits.join(', ')}`,
    });
    await revert(client, candidate.id);
    return null;
  }

  // Slug + uniqueness.
  const slug = await uniqueSlug(client, article.title);

  // Author by category. Hero image is left NULL — news-images picks up
  // the NULL as its gating signal and fills hero_image_url + alt + credit.
  const author = authorForCategory(category);

  const { data: insertData, error: insertError } = await client
    .from('articles')
    .insert({
      slug,
      title: trimLen(article.title, 200),
      subtitle: trimLen(article.subtitle, 300),
      lead: trimLen(article.lead, 600),
      body_md: article.body_md,
      hero_image_url: null,
      hero_image_alt: null,
      hero_image_credit: null,
      category,
      author_name: author.name,
      author_slug: author.slug,
      status: 'draft',
      published_at: null,
      meta_title: trimLen(article.meta_title, 70),
      meta_description: trimLen(article.meta_description, 200),
      source_candidate_id: candidate.id,
    })
    .select('id')
    .single();

  if (insertError || !insertData) {
    errors.push({
      candidate_id: candidate.id,
      stage: 'insert',
      message: `insert: ${insertError?.message ?? 'no row returned'}`,
    });
    await revert(client, candidate.id);
    return null;
  }

  // Link the candidate to the new article. Status stays at 'writing' until
  // news-publish runs (or the smoke-test publish below picks one to flip).
  await client
    .from('news_candidates')
    .update({ article_id: insertData.id })
    .eq('id', candidate.id);

  return insertData.id as string;
}

async function revert(client: Client, candidateId: string): Promise<void> {
  await client
    .from('news_candidates')
    .update({ status: 'ready', claimed_at: null, claimed_by: null })
    .eq('id', candidateId);
}

function pickCategory(suggested: string | null): string {
  if (suggested && VALID_CATEGORIES.has(suggested)) return suggested;
  return 'markets';
}

function buildBriefUserMessage(c: ClaimedCandidate, category: string): string {
  const sc = (c.suggested_companies ?? []).slice(0, 6).join(', ') || '(none resolved)';
  return `# Candidate

Title:    ${c.source_title}
URL:      ${c.source_url ?? '(none)'}
Pub date: ${c.source_pub_date ?? 'unknown'}
Category: ${category}
Resolved company IDs: ${sc}

Summary:
${c.source_summary ?? '(none)'}

Produce the editorial brief as the JSON object specified.`;
}

function buildArticleUserMessage(
  c: ClaimedCandidate,
  category: string,
  brief: BriefAIResponse,
): string {
  const contextNeeded = Array.isArray(brief.context_needed)
    ? brief.context_needed.map((s) => `- ${s}`).join('\n')
    : brief.context_needed;
  const h2List = (brief.suggested_h2_sections ?? []).map((s) => `- ${s}`).join('\n');
  return `# Editorial brief

Core story:        ${brief.core_story}
Why it matters:    ${brief.why_it_matters}
Editorial angle:   ${brief.editorial_angle}
Target word count: ${brief.target_word_count}

Context needed:
${contextNeeded}

Suggested H2 sections:
${h2List}

# Candidate (source material)

Title:    ${c.source_title}
URL:      ${c.source_url ?? '(none)'}
Pub date: ${c.source_pub_date ?? 'unknown'}
Category: ${category}

Summary:
${c.source_summary ?? '(none)'}

Write the full article as the JSON object specified. Hit the target
word count within ±15%. Use ## for H2 sections and ### for any H3
sub-sections. The body_md must be valid markdown only.`;
}

// ---------- slug + utilities ----------

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'is',
  'it', 'of', 'on', 'or', 'the', 'to', 'with',
]);

async function uniqueSlug(client: Client, title: string): Promise<string> {
  const base = slugify(title);
  // First try the exact slug; on collision, suffix -2, -3, ...
  let candidate = base;
  for (let i = 2; i < 100; i++) {
    const { data } = await client.from('articles').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i}`;
  }
  // Fallback — vanishingly unlikely.
  return `${base}-${Date.now()}`;
}

function slugify(title: string): string {
  // ASCII fold accents, lowercase, strip non-letter/digit, take first 5-7 words.
  const ascii = title.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const cleaned = ascii.toLowerCase().replace(/[^a-z0-9\s-]+/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  const filtered = words.filter((w) => !STOP_WORDS.has(w));
  const pick = (filtered.length >= 5 ? filtered : words).slice(0, 7);
  if (pick.length === 0) return `article-${Date.now()}`;
  return pick.join('-').replace(/-+/g, '-');
}

function trimLen(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
