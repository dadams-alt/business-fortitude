// scripts/redraft-test.ts
//
// Dry-run grading harness for the news-write prompts. Pulls every
// published article from production, re-runs the BRIEF_PROMPT +
// ARTICLE_PROMPT pair against each one's source candidate, and writes a
// side-by-side comparison file per slug. Does NOT write redrafts back
// to the database — this exists to grade prompt quality before redeploy.
//
// Run with:
//   deno run --allow-net --allow-read --allow-env --allow-write \
//     scripts/redraft-test.ts
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY
// from .env.local. Only ANTHROPIC_API_KEY needs to be set explicitly;
// the two SUPABASE_* values come down via `vercel env pull`.
//
// Cost ballpark: 8 articles × 2 Opus passes ≈ $4. Run sparingly.

import {
  BRIEF_PROMPT,
  ARTICLE_PROMPT,
} from '../supabase/functions/news-write/prompts.ts';

const ENV_PATH = new URL('../.env.local', import.meta.url);
const OUT_DIR = new URL('./redraft-test-output/', import.meta.url);

const BANNED_TOKENS = [
  '—',
  /\bdelve\b/i,
  /\bin today's fast-paced world\b/i,
  /\bgame[- ]changing\b/i,
  /\brevolutionary\b/i,
];

interface PublishedArticle {
  slug: string;
  title: string;
  subtitle: string | null;
  lead: string | null;
  body_md: string;
  category: string;
  published_at: string;
  source_candidate_id: string | null;
}

interface SourceCandidate {
  id: string;
  source_title: string;
  source_url: string | null;
  source_summary: string | null;
  source_pub_date: string | null;
  suggested_category: string | null;
  suggested_companies: string[] | null;
  suggested_tickers: string[] | null;
  suggested_executives: string[] | null;
  suggested_sectors: string[] | null;
  priority_score: number | null;
}

interface BriefAIResponse {
  core_story: string;
  why_it_matters: string;
  editorial_angle: string;
  context_needed: string | string[];
  target_word_count: number;
  suggested_h2_sections: string[];
  named_entities?: {
    companies?: string[];
    tickers?: string[];
    executives?: string[];
    sectors?: string[];
  };
}

interface ArticleAIResponse {
  title: string;
  subtitle: string;
  lead: string;
  body_md: string;
  meta_title: string;
  meta_description: string;
}

async function loadEnv(): Promise<Record<string, string>> {
  const text = await Deno.readTextFile(ENV_PATH);
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function supabaseRest<T>(
  url: string,
  serviceRole: string,
  path: string,
): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`supabase ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function callOpusJson<T>(
  apiKey: string,
  system: string,
  user: string,
  temperature: number,
): Promise<T> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = json.content?.find((c) => c.type === 'text')?.text ?? '';
  const stripped = text
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  return JSON.parse(stripped) as T;
}

function buildBriefUser(c: SourceCandidate): string {
  return [
    `Title: ${c.source_title}`,
    `URL: ${c.source_url ?? '(none)'}`,
    `Source date: ${c.source_pub_date ?? '(unknown)'}`,
    `Suggested category: ${c.suggested_category ?? '(none)'}`,
    `Suggested companies: ${(c.suggested_companies ?? []).join(', ') || '(none)'}`,
    `Suggested tickers: ${(c.suggested_tickers ?? []).join(', ') || '(none)'}`,
    `Suggested executives: ${(c.suggested_executives ?? []).join(', ') || '(none)'}`,
    `Suggested sectors: ${(c.suggested_sectors ?? []).join(', ') || '(none)'}`,
    `Priority score: ${c.priority_score ?? '(none)'}`,
    '',
    `Summary:`,
    c.source_summary ?? '(no summary available)',
  ].join('\n');
}

function buildArticleUser(brief: BriefAIResponse, c: SourceCandidate): string {
  return [
    'Editorial brief:',
    JSON.stringify(brief, null, 2),
    '',
    'Source title:',
    c.source_title,
    '',
    'Source URL:',
    c.source_url ?? '(none)',
    '',
    'Source summary:',
    c.source_summary ?? '(no summary)',
  ].join('\n');
}

function diffNotes(
  original: PublishedArticle,
  redraft: ArticleAIResponse,
): string[] {
  const notes: string[] = [];
  if (original.title !== redraft.title) {
    notes.push(`Title changed: "${original.title}" → "${redraft.title}"`);
  }
  if ((original.subtitle ?? '') !== redraft.subtitle) {
    notes.push('Subtitle differs (see side-by-side).');
  }
  const origLen = original.body_md.length;
  const newLen = redraft.body_md.length;
  const pct = Math.round(((newLen - origLen) / Math.max(origLen, 1)) * 100);
  notes.push(`Body length: ${origLen} → ${newLen} chars (${pct >= 0 ? '+' : ''}${pct}%)`);

  const hits: string[] = [];
  for (const t of BANNED_TOKENS) {
    if (typeof t === 'string') {
      if (redraft.body_md.includes(t)) hits.push(t);
    } else if (t.test(redraft.body_md)) {
      hits.push(t.source);
    }
  }
  notes.push(
    hits.length === 0
      ? 'Banned tokens: none detected.'
      : `Banned tokens still present: ${hits.join(', ')}`,
  );
  notes.push(
    'Disclosure: rendered automatically by <DisclosureBox /> at the article-page layer; not written by the LLM and therefore not part of body_md.',
  );
  return notes;
}

function renderComparison(
  original: PublishedArticle,
  brief: BriefAIResponse,
  redraft: ArticleAIResponse,
): string {
  const notes = diffNotes(original, redraft);
  return [
    `# Redraft comparison: ${original.slug}`,
    '',
    `Category: ${original.category}  •  Originally published: ${original.published_at}`,
    '',
    '## 1. Original published article',
    '',
    `**${original.title}**`,
    '',
    original.subtitle ? `*${original.subtitle}*` : '',
    '',
    original.lead ?? '',
    '',
    original.body_md,
    '',
    '## 2. New draft',
    '',
    '### Brief',
    '',
    '```json',
    JSON.stringify(brief, null, 2),
    '```',
    '',
    `**${redraft.title}**`,
    '',
    `*${redraft.subtitle}*`,
    '',
    redraft.lead,
    '',
    redraft.body_md,
    '',
    `Meta title: ${redraft.meta_title}`,
    `Meta description: ${redraft.meta_description}`,
    '',
    '## 3. Diff notes',
    '',
    ...notes.map((n) => `- ${n}`),
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const env = await loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  if (!anthropicKey) {
    throw new Error('Set ANTHROPIC_API_KEY in .env.local before running this script.');
  }

  await Deno.mkdir(OUT_DIR, { recursive: true });

  const articles = await supabaseRest<PublishedArticle[]>(
    supabaseUrl,
    serviceRole,
    'articles?select=slug,title,subtitle,lead,body_md,category,published_at,source_candidate_id&status=eq.published&order=published_at.desc',
  );
  console.log(`Loaded ${articles.length} published articles.`);

  for (const article of articles) {
    if (!article.source_candidate_id) {
      console.log(`Skipping ${article.slug}: no source candidate (hand-seeded).`);
      continue;
    }
    const [candidate] = await supabaseRest<SourceCandidate[]>(
      supabaseUrl,
      serviceRole,
      `news_candidates?select=*&id=eq.${article.source_candidate_id}`,
    );
    if (!candidate) {
      console.log(`Skipping ${article.slug}: candidate row missing.`);
      continue;
    }

    console.log(`Redrafting ${article.slug}…`);
    const brief = await callOpusJson<BriefAIResponse>(
      anthropicKey,
      BRIEF_PROMPT,
      buildBriefUser(candidate),
      0.3,
    );
    const redraft = await callOpusJson<ArticleAIResponse>(
      anthropicKey,
      ARTICLE_PROMPT,
      buildArticleUser(brief, candidate),
      0.8,
    );

    const path = new URL(`${article.slug}.md`, OUT_DIR);
    await Deno.writeTextFile(path, renderComparison(article, brief, redraft));
    console.log(`  → ${path.pathname}`);
  }

  console.log('Done.');
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
}
