// scripts/cutover/indexnow-submit.ts
//
// One-shot bulk IndexNow submission for the brand-domain cutover.
// Pulls every published article URL plus the homepage and the 15
// /category/<slug> indexes, builds a single IndexNow payload, and
// POSTs it to https://api.indexnow.org/indexnow. Bing + Yandex pick
// up the submission from there.
//
// Pre-conditions before running:
//   1. DNS for www.businessfortitude.com points at Vercel.
//   2. https://www.businessfortitude.com/<INDEXNOW_API_KEY>.txt
//      returns 200 + the key value (verified by IndexNow before it
//      accepts the URL list).
//
// Run:
//   cd ~/code/business-fortitude
//   deno run --allow-net --allow-read --allow-env scripts/cutover/indexnow-submit.ts
//
// Reads INDEXNOW_API_KEY from .env.local. The Supabase URL list is
// pulled via the Supabase REST endpoint using the anon key (articles
// are public-readable when status='published' per the existing RLS
// policy).

const ENV_PATH = new URL('../../.env.local', import.meta.url);
const HOST = 'www.businessfortitude.com';
const SITE_URL = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const STATIC_PATHS = [
  '/',
  '/about',
  '/how-bf-works',
  '/privacy',
  '/terms',
  '/cookies',
  '/companies',
  '/people',
  '/sectors',
  '/tickers',
];

const CATEGORY_SLUGS = [
  // canonical
  'markets', 'deals', 'leadership', 'ai', 'startups', 'regulation', 'opinion',
  // legacy archive
  'marketing-growth', 'finance-economy', 'industry-watch', 'leadership-people',
  'policy-regulation', 'news', 'tech-innovation', 'opinion-analysis',
];

async function loadEnv(): Promise<Record<string, string>> {
  const text = await Deno.readTextFile(ENV_PATH);
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
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

interface ArticleSlug { slug: string }

async function fetchAllSlugs(
  supabaseUrl: string,
  anonKey: string,
): Promise<string[]> {
  const slugs: string[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const url = `${supabaseUrl}/rest/v1/articles?select=slug&status=eq.published&order=published_at.desc&offset=${offset}&limit=${PAGE}`;
    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`supabase REST ${res.status}: ${await res.text()}`);
    }
    const rows = (await res.json()) as ArticleSlug[];
    if (rows.length === 0) break;
    for (const r of rows) slugs.push(r.slug);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return slugs;
}

async function main(): Promise<void> {
  const env = await loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const indexNowKey = env.INDEXNOW_API_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
  if (!indexNowKey || !/^[a-f0-9]{32}$/.test(indexNowKey)) {
    throw new Error('INDEXNOW_API_KEY missing or not 32-hex; check .env.local');
  }

  // Sanity-check that the key file is reachable on the brand domain.
  // If the verification URL is not 200 here, IndexNow will reject the
  // submission too — better to surface that now than after the POST.
  const keyUrl = `${SITE_URL}/${indexNowKey}.txt`;
  console.error(`Verifying key file at ${keyUrl}...`);
  const keyRes = await fetch(keyUrl);
  if (!keyRes.ok) {
    throw new Error(`Key file not reachable: ${keyRes.status}. DNS / deploy not ready?`);
  }
  const keyBody = (await keyRes.text()).trim();
  if (keyBody !== indexNowKey) {
    throw new Error(`Key file body mismatch: served '${keyBody.slice(0, 8)}...' vs expected '${indexNowKey.slice(0, 8)}...'`);
  }
  console.error('  Key file OK.');

  console.error(`Fetching article slugs from ${supabaseUrl}...`);
  const slugs = await fetchAllSlugs(supabaseUrl, anonKey);
  console.error(`  ${slugs.length} published articles.`);

  const articleUrls = slugs.map((s) => `${SITE_URL}/article/${s}`);
  const staticUrls = STATIC_PATHS.map((p) => `${SITE_URL}${p}`);
  const categoryUrls = CATEGORY_SLUGS.map((s) => `${SITE_URL}/category/${s}`);
  const urlList = [...staticUrls, ...categoryUrls, ...articleUrls];

  console.error(`Submitting ${urlList.length} URLs to IndexNow...`);

  const payload = {
    host: HOST,
    key: indexNowKey,
    keyLocation: keyUrl,
    urlList,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.error(`  IndexNow response: ${res.status} ${res.statusText}`);
  const body = await res.text();
  if (body) console.error(`  body: ${body.slice(0, 500)}`);

  if (!res.ok && res.status !== 202) {
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
}
