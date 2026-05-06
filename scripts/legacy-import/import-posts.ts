// scripts/legacy-import/import-posts.ts
//
// One-shot importer for the legacy Lovable archive. Reads
// legacy-content/posts.csv, converts each row's HTML content to
// markdown (the new article-body renderer is react-markdown), looks
// up category + author from the sibling CSVs, and writes a series of
// batched SQL files to legacy-content/import-batches/. Each file is
// one INSERT ... ON CONFLICT (id) DO NOTHING covering up to BATCH_SIZE
// rows. Apply each batch via Supabase MCP execute_sql or `supabase db
// execute -f ...`.
//
// We generate SQL rather than upserting via supabase-js because the
// Vercel-pulled .env.local masks Sensitive secrets (SERVICE_ROLE_KEY
// comes through empty). Generating SQL keeps the legacy-import path
// free of that constraint.
//
// Run:
//   deno run --allow-read --allow-write scripts/legacy-import/import-posts.ts
//
// Idempotent: every batch SQL ends with ON CONFLICT (id) DO NOTHING.
// Re-running the script regenerates the same files; re-applying any
// batch is a no-op for rows already present.

import TurndownService from 'turndown';
// @ts-ignore — turndown-plugin-gfm has no shipped types.
import * as gfm from 'turndown-plugin-gfm';
import { loadAuthors, loadCategories, loadPosts } from './parse-csvs.ts';

const OUT_DIR = new URL('../../legacy-content/import-batches/', import.meta.url);
const BATCH_SIZE = 50;

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  lead: string | null;
  body_md: string;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  category: string;
  author_name: string | null;
  author_slug: string | null;
  status: 'published';
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

function makeTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    linkStyle: 'inlined',
  });
  service.use(gfm.gfm);
  service.remove(['script', 'style', 'iframe', 'noscript']);
  return service;
}

function htmlToMarkdown(html: string, turndown: TurndownService): string {
  if (!html) return '';
  return turndown.turndown(html).trim();
}

function nullableText(s: string | null | undefined): string | null {
  if (s === null || s === undefined) return null;
  const trimmed = s.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function quote(value: string | null): string {
  if (value === null) return 'NULL';
  return "'" + value.replace(/'/g, "''") + "'";
}

function rowToValuesTuple(row: ArticleRow): string {
  const cols = [
    quote(row.id),
    quote(row.slug),
    quote(row.title),
    quote(row.subtitle),
    quote(row.lead),
    quote(row.body_md),
    quote(row.hero_image_url),
    quote(row.hero_image_alt),
    quote(row.category),
    quote(row.author_name),
    quote(row.author_slug),
    quote(row.status),
    quote(row.published_at),
    quote(row.meta_title),
    quote(row.meta_description),
    quote(row.created_at),
    quote(row.updated_at),
  ];
  return '  (' + cols.join(', ') + ')';
}

const COLUMNS = [
  'id',
  'slug',
  'title',
  'subtitle',
  'lead',
  'body_md',
  'hero_image_url',
  'hero_image_alt',
  'category',
  'author_name',
  'author_slug',
  'status',
  'published_at',
  'meta_title',
  'meta_description',
  'created_at',
  'updated_at',
];

interface SkipReason {
  id: string;
  slug: string;
  reason: string;
}

async function main(): Promise<void> {
  const turndown = makeTurndown();

  console.error('Loading CSVs…');
  const [categories, authors, posts] = await Promise.all([
    loadCategories(),
    loadAuthors(),
    loadPosts(),
  ]);
  console.error(
    `  Categories: ${categories.length}, Authors: ${authors.length}, Posts: ${posts.length}`,
  );

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const authorById = new Map(authors.map((a) => [a.id, a]));

  const skips: SkipReason[] = [];
  const rows: ArticleRow[] = [];
  const seenSlugs = new Set<string>();

  for (const post of posts) {
    if (post.status !== 'published') {
      skips.push({ id: post.id, slug: post.slug, reason: 'status_not_published' });
      continue;
    }
    if (seenSlugs.has(post.slug)) {
      // Duplicate slug within the export itself — DB would reject the second.
      skips.push({ id: post.id, slug: post.slug, reason: 'duplicate_slug_within_export' });
      continue;
    }
    const cat = categoryById.get(post.category_id);
    if (!cat) {
      skips.push({ id: post.id, slug: post.slug, reason: `unknown_category_id` });
      continue;
    }
    const author = authorById.get(post.author_id);
    if (!author) {
      skips.push({ id: post.id, slug: post.slug, reason: `unknown_author_id` });
      continue;
    }
    const md = htmlToMarkdown(post.content, turndown);
    if (!md) {
      skips.push({ id: post.id, slug: post.slug, reason: 'empty_body_after_md_conversion' });
      continue;
    }

    rows.push({
      id: post.id,
      slug: post.slug,
      title: post.title,
      subtitle: null,
      lead: nullableText(post.excerpt),
      body_md: md,
      hero_image_url: nullableText(post.feature_image_url),
      hero_image_alt: nullableText(post.feature_image_alt),
      category: cat.slug,
      author_name: author.name,
      author_slug: author.slug,
      status: 'published',
      published_at: nullableText(post.published_at),
      meta_title: nullableText(post.meta_title),
      meta_description: nullableText(post.meta_description),
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || post.created_at || new Date().toISOString(),
    });
    seenSlugs.add(post.slug);
  }

  console.error('');
  console.error(`Plan: ${rows.length} rows queued for INSERT, ${skips.length} skipped.`);
  const reasonCounts = skips.reduce<Record<string, number>>((acc, s) => {
    acc[s.reason] = (acc[s.reason] ?? 0) + 1;
    return acc;
  }, {});
  for (const [reason, count] of Object.entries(reasonCounts)) {
    console.error(`  skip[${reason}] = ${count}`);
  }

  await Deno.mkdir(OUT_DIR, { recursive: true });
  // Wipe any prior batches first so re-runs don't leave stale files.
  for await (const entry of Deno.readDir(OUT_DIR)) {
    if (entry.isFile && entry.name.endsWith('.sql')) {
      await Deno.remove(new URL(entry.name, OUT_DIR));
    }
  }

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  for (let b = 0; b < totalBatches; b++) {
    const batch = rows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const sql = [
      `INSERT INTO public.articles (${COLUMNS.join(', ')}) VALUES`,
      batch.map(rowToValuesTuple).join(',\n'),
      'ON CONFLICT (id) DO NOTHING;',
    ].join('\n');
    const filename = `batch-${String(b + 1).padStart(3, '0')}.sql`;
    await Deno.writeTextFile(new URL(filename, OUT_DIR), sql + '\n');
    console.error(`  wrote ${filename} (${batch.length} rows)`);
  }

  // Also write the skip report so the operator can spot-check.
  const skipReport = [
    `# Skip report (${skips.length} skipped of ${posts.length} CSV rows)`,
    '',
    ...Object.entries(reasonCounts).map(([reason, count]) => `- ${reason}: ${count}`),
    '',
    '## Detail',
    '',
    ...skips.map((s) => `- [${s.reason}] ${s.id} — ${s.slug}`),
  ].join('\n');
  await Deno.writeTextFile(new URL('_skip-report.md', OUT_DIR), skipReport + '\n');
  console.error(`  wrote _skip-report.md`);

  console.error('');
  console.error(`Done. Apply batches via Supabase MCP execute_sql or supabase CLI.`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
}
