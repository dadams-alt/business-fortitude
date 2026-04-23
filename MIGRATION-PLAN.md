# Business Fortitude — Migration & News-Engine Port Plan

**Audience:** Claude Code (and any human collaborator) executing the migration.
**Source of truth for architecture:** the SportSignals handoff document. This plan adapts that system to Business Fortitude (BF).
**Decisions already locked in (owner: dave@axiasignalsgroup.com):**

1. Frontend migrates to **Next.js App Router**.
2. Core entities are **Companies, Tickers, Executives, Sectors**.
3. Airtable is a Make.com scratchpad — **nothing to migrate out of Airtable**.
4. Strategy is a **big-bang cutover**: stand up new stack, cut over in one window, decommission Lovable/Make.com/Airtable.

Read this whole document before writing code. Paths in back-ticks point into the current Lovable export (unpacked in your workspace) unless stated otherwise.

---

## 0. What exists today (audit summary)

The Lovable export is already on Supabase — Airtable and Make.com only own the *pipeline*, not the data store. That makes the cutover simpler than it looked on the surface.

**Frontend**

- Vite + React 18 SPA, React Router v6 (`src/App.tsx`), TanStack Query, `react-helmet-async`, Tailwind + shadcn/ui, Tiptap editor for the admin, `dompurify` for HTML sanitisation.
- Public routes: `/`, `/about`, `/search`, `/category/:slug`, `/category/:categorySlug/:articleSlug`, `/author/:slug`, `/tag/:slug`, `/latest`, `/privacy`, `/terms`, `/cookie-policy`, catch-all `/:slug`, and `/account`.
- Admin routes under `/admin`: dashboard, posts CRUD, category/tag/author management, pages CRUD, comments moderation, profiles (users), settings.
- Pre-rendering is currently done externally by `lovablehtml.com` sitting in front of the SPA.

**Supabase (existing schema — 15 migrations)**

Tables: `categories`, `authors`, `posts`, `pages`, `site_settings`, `user_roles` (enum `app_role`: admin/moderator/user), `profiles`, `user_favourites`, `comments`, `tags`, `post_tags`, `newsletter_subscribers`, `slug_redirects`, `page_views`, `stock_cache`. RLS is on everywhere, with public read for published rows and admin-only writes gated by `has_role(auth.uid(), 'admin')`.

`posts` columns today:
`id, title, slug, excerpt, content, feature_image_url, feature_image_alt, category_id, author_id, status, published_at, meta_title, meta_description, created_at, updated_at, key_points, key_takeaways, discussion_question`.
A DB trigger `trg_auto_assign_author` auto-assigns authors based on category.

Storage bucket: `media` (public read, auth write).

**Edge functions (9)**

- `rss` — serves the public outbound RSS feed of published posts.
- `sitemap` — serves `sitemap.xml`.
- `llms-txt`, `llms-full-txt` — LLM-friendly site maps.
- `semantic-search` — search endpoint.
- `stock-ticker` — caches stock prices into `stock_cache`.
- `auto-categorize` — categorisation helper.
- `invite-admin` — admin onboarding.
- **`make-post`** — API-key-protected webhook that Make.com POSTs completed articles to. Body: `{title, slug, excerpt, content, feature_image_url, feature_image_alt, meta_title, meta_description, status, published_at, category_id|category_slug, author_id|author_slug}`. This is the integration point we are replacing.

**Pipeline today (the thing being retired)**

Make.com reads RSS feeds → stores intermediate state in Airtable → calls an LLM to write copy → POSTs the finished article to `make-post` → Supabase stores it → Lovable SPA renders it → `lovablehtml.com` pre-renders for SEO.

**Implication for the port:** most of the storage layer is already in the right place. The work is (a) extending the schema to support a SportSignals-style status machine, (b) building the 5-stage Supabase edge-function pipeline, (c) moving the frontend to Next.js App Router on Vercel, and (d) retiring the Lovable/Make.com/Airtable trio in one cutover.

---

## 1. Target architecture

```
                        ┌─────────────────────────┐
                        │ GitHub (business-fortitude) │
                        └────────────┬────────────┘
                                     │ CI / Vercel deploy
                                     ▼
┌────────────────────────┐   ┌─────────────────────┐
│ Supabase (new project) │◄──┤  Vercel (Next.js 15 │
│  Postgres + Storage    │   │  App Router + ISR)  │
│  Edge Functions (Deno) │   └────────┬────────────┘
│  Cron (pg_cron)        │            │
└────────────┬───────────┘            │ ISR revalidate
             │ pipeline state         │ + IndexNow on publish
             ▼
     [rss_feeds] ─► news-ingest-rss ─► [news_candidates: pending]
                                              │
                                  news-filter (Claude Sonnet 4.6)
                                              │
                              ┌──► rejected/duplicate
                              └──► approved
                                              │
                          news-write (Opus 4.7 ×2 + Sonnet 4.6 ×2)
                                              │
                                  [articles: draft, no image]
                                              │
                          news-images (Haiku 4.5 prompt + Gemini image)
                                              │
                                  [articles: draft, image ready]
                                              │
                                news-publish (slug + IndexNow + ISR)
                                              │
                                  [articles: published]
                                              │
                                      ◄── Next.js /latest, /category, /article
```

Every arrow is an independent cron-triggered Supabase Edge Function. No in-process queue — state lives in Postgres. Concurrency is handled by `FOR UPDATE SKIP LOCKED` inside RPCs.

**Stack versions**

- Next.js 15, React 19, Node 20 runtime on Vercel.
- Supabase Postgres 15, Edge Functions on Deno, pg_cron for scheduling.
- Claude models: **Opus 4.7** (`claude-opus-4-6`), **Sonnet 4.6** (`claude-sonnet-4-6`), **Haiku 4.5** (`claude-haiku-4-5-20251001`). These are the current flagship IDs — bump from the 4.0 line SportSignals is using.
- Gemini `gemini-3-pro-image-preview` for hero image generation.
- IndexNow for instant search-engine indexing.

---

## 2. Data model

Principle: keep BF's existing `posts` table as the articles store — **rename semantically, don't duplicate**. Extend it with the SportSignals columns and add the new pipeline tables around it. Keep `post_tags`, `categories`, `authors`, `tags` as-is.

### 2.1 Extend `posts` (aliased as "articles" in new code)

```sql
ALTER TABLE public.posts
  ADD COLUMN h1 text,
  ADD COLUMN subtitle text,
  ADD COLUMN content_html text,          -- sanitised HTML (the new renderer reads this)
  ADD COLUMN body jsonb,                 -- block representation for admin editor
  ADD COLUMN faq_data jsonb,             -- [{question, answer}]
  ADD COLUMN seo_keywords text[],
  ADD COLUMN schema_type text DEFAULT 'NewsArticle',
  ADD COLUMN article_type text DEFAULT 'news',   -- news | analysis | explainer | earnings_preview
  ADD COLUMN internal_links jsonb,       -- [{entity_type, entity_name, url, anchor_text}]
  ADD COLUMN source_urls text[],
  ADD COLUMN news_candidate_id uuid,     -- FK set by news-write (added below)
  ADD COLUMN read_time_minutes int,
  ADD COLUMN word_count int,
  ADD COLUMN company_ids uuid[] DEFAULT '{}',
  ADD COLUMN ticker_ids uuid[] DEFAULT '{}',
  ADD COLUMN executive_ids uuid[] DEFAULT '{}',
  ADD COLUMN sector_ids uuid[] DEFAULT '{}',
  ADD COLUMN priority_score int;         -- copied from candidate for ordering

-- `content` stays for legacy Lovable posts; new writes use content_html + body.
-- A back-fill migration copies content → content_html where content_html IS NULL.

CREATE INDEX idx_posts_status_published_at ON public.posts(status, published_at DESC);
CREATE INDEX idx_posts_company_ids ON public.posts USING GIN (company_ids);
CREATE INDEX idx_posts_ticker_ids ON public.posts USING GIN (ticker_ids);
CREATE INDEX idx_posts_executive_ids ON public.posts USING GIN (executive_ids);
CREATE INDEX idx_posts_sector_ids ON public.posts USING GIN (sector_ids);
```

Keep `status` text for compatibility but use values `draft | scheduled | published` only.

### 2.2 New table: `rss_feeds`

```sql
CREATE TABLE public.rss_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  url text NOT NULL UNIQUE,
  tier int NOT NULL DEFAULT 2,                    -- 1=premium, 3=noise
  language text NOT NULL DEFAULT 'en',
  topic_focus text[] DEFAULT '{}',                -- e.g. {"ai","fintech"}
  poll_interval_minutes int NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  last_polled_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  consecutive_failures int NOT NULL DEFAULT 0,
  items_ingested int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage feeds" ON public.rss_feeds FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### 2.3 New table: `news_candidates`

```sql
CREATE TABLE public.news_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_title text NOT NULL,
  source_url text UNIQUE,
  source_feed uuid REFERENCES public.rss_feeds(id),
  source_pub_date timestamptz,
  source_author text,
  source_summary text,
  full_text text,
  content_hash text UNIQUE,                       -- sha256 of normalised title
  status text NOT NULL DEFAULT 'pending',         -- pending|approved|rejected|duplicate|writing|published|failed
  priority_score int,
  suggested_category text,                        -- slug
  suggested_companies uuid[] DEFAULT '{}',
  suggested_tickers uuid[] DEFAULT '{}',
  suggested_executives uuid[] DEFAULT '{}',
  suggested_sectors uuid[] DEFAULT '{}',
  rejection_reason text,
  processed_at timestamptz,
  article_id uuid REFERENCES public.posts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_candidates_status ON public.news_candidates(status, priority_score DESC);
ALTER TABLE public.news_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read candidates" ON public.news_candidates FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.posts
  ADD CONSTRAINT posts_candidate_fk FOREIGN KEY (news_candidate_id)
  REFERENCES public.news_candidates(id);
```

### 2.4 Entity tables

All follow the same shape. `aliases` handles fuzzy resolution ("Alphabet" vs "Google", "Facebook" vs "Meta").

```sql
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  aliases text[] DEFAULT '{}',
  description text,
  logo_url text,
  website_url text,
  hq_country text,
  founded_year int,
  is_public boolean DEFAULT false,
  primary_ticker_id uuid,                         -- FK set after tickers table
  sector_ids uuid[] DEFAULT '{}',
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,                           -- "AAPL"
  exchange text NOT NULL,                         -- "NASDAQ", "LSE"
  slug text UNIQUE NOT NULL,                      -- "nasdaq-aapl"
  company_id uuid REFERENCES public.companies(id),
  currency text,
  is_active boolean DEFAULT true,
  UNIQUE (symbol, exchange)
);

ALTER TABLE public.companies
  ADD CONSTRAINT companies_primary_ticker_fk
  FOREIGN KEY (primary_ticker_id) REFERENCES public.tickers(id);

CREATE TABLE public.executives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  aliases text[] DEFAULT '{}',
  role text,                                      -- "CEO", "CFO", "Chair"
  current_company_id uuid REFERENCES public.companies(id),
  bio text,
  photo_url text,
  linkedin_url text,
  twitter_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                             -- "Artificial Intelligence"
  slug text UNIQUE NOT NULL,                      -- "ai"
  aliases text[] DEFAULT '{}',
  description text,
  parent_sector_id uuid REFERENCES public.sectors(id),
  meta_title text,
  meta_description text
);

-- All four get RLS: public read, admin write.
```

### 2.5 Concurrency RPCs — port verbatim

```sql
CREATE OR REPLACE FUNCTION public.claim_news_candidates(p_limit int)
RETURNS SETOF public.news_candidates
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  UPDATE public.news_candidates c
     SET status = 'writing',
         processed_at = now()
    FROM (
      SELECT id FROM public.news_candidates
       WHERE status = 'approved'
       ORDER BY priority_score DESC NULLS LAST, created_at ASC
       LIMIT p_limit
       FOR UPDATE SKIP LOCKED
    ) picked
   WHERE c.id = picked.id
   RETURNING c.*;
END; $$;

CREATE OR REPLACE FUNCTION public.release_stale_writing_candidates(p_age_minutes int)
RETURNS int LANGUAGE sql SECURITY DEFINER AS $$
  WITH released AS (
    UPDATE public.news_candidates
       SET status = 'approved'
     WHERE status = 'writing'
       AND processed_at < now() - make_interval(mins => p_age_minutes)
     RETURNING 1
  )
  SELECT count(*)::int FROM released;
$$;
```

### 2.6 Storage

New bucket `news-images` (public read, service-role write). Path convention: `news-images/{category-slug}/{timestamp}-{article-id}.jpg`.

---

## 3. Edge functions — spec per function

All functions live under `supabase/functions/<name>/index.ts`. Shared helpers in `supabase/functions/_shared/`. All use Deno, `esm.sh` for `@supabase/supabase-js`. All are triggered by `pg_cron` calling a Postgres function that does `net.http_post` to the function URL with the service-role secret — schedule hourly unless noted.

### 3.1 `_shared/news-ai.ts`

Central Anthropic wrapper:

```
opus   → claude-opus-4-6
sonnet → claude-sonnet-4-6
haiku  → claude-haiku-4-5-20251001
```

Exports `callNewsAI(model, messages, {max_tokens, temperature})` and `callNewsAIJson<T>(…)` with JSON extraction + retry on schema mismatch. Default temperatures: 0.3 for structural tasks (filter, SEO, slugs, translation), 0.8 for creative (article, image prompt).

### 3.2 `_shared/gemini.ts`

Wraps `gemini-3-pro-image-preview` REST endpoint. Input: text prompt, aspect ratio `1200x630`. Returns a `Uint8Array` JPEG. One retry with 2s backoff.

### 3.3 `news-ingest-rss`

Responsibilities:

- For each `rss_feeds` row where `is_active = true` and `last_polled_at IS NULL OR last_polled_at < now() - interval(poll_interval_minutes)`, fetch and parse the feed.
- Parse RSS 2.0 and Atom 1.0 natively (no external parser). Handle CDATA, `content:encoded`, alternate `<link>` attr shapes.
- Only consider items within the last 72 hours.
- For each item: compute `content_hash = sha256(normalise(title))`. Skip if `(source_url OR content_hash)` already exists.
- Scrape full text from `source_url`: fetch with spoofed UA, 15 s timeout. Extract `<article>` → `<main>` → `<body>` in priority. Strip `<script>/<style>/<nav>/<footer>/<aside>/<header>`. Cap at 10 000 chars.
- Non-English feeds: one Sonnet call to translate title + summary to British English (temperature 0.3, max_tokens 500).
- Insert `status='pending'` candidate. Update `rss_feeds.last_polled_at`, `last_success_at`, `items_ingested`, reset `consecutive_failures`.
- On failure: increment `consecutive_failures`, set `last_error`. Disable feed at 10 consecutive failures.

### 3.4 `news-filter`

Responsibilities:

- Process up to 20 `pending` candidates per run.
- Build context block: last 3 days of articles (50 titles) + last 3 days of candidates (50 titles) so Claude can judge duplication.
- One Sonnet call per candidate with the BF editorial rubric (see §4 for the rubric text).
- Resolve entity names → FK IDs against `companies.name`/`aliases`, `tickers.symbol`, `executives.name`/`aliases`, `sectors.name`/`aliases`. Case-insensitive, fuzzy (substring both directions, accent-stripped).
- Write back: `status`, `suggested_category`, `suggested_companies`, `suggested_tickers`, `suggested_executives`, `suggested_sectors`, `priority_score`, `rejection_reason`, `processed_at`.

Output contract:

```ts
{
  decision: "approve" | "reject" | "duplicate",
  reason: string,
  category: string,           // slug — must be one of the BF category slugs
  companies: string[],        // names
  tickers: string[],          // symbols
  executives: string[],       // names
  sectors: string[],          // names or slugs
  priority: number,           // 1–100
  duplicate_of_title?: string
}
```

### 3.5 `news-write`

Claims 1–2 approved candidates via `claim_news_candidates(2)`. Four sequential Claude calls per article:

1. **Editorial brief — Opus.** Outputs `{core_story, why_it_matters, editorial_angle, context_needed, target_word_count, suggested_h2_sections}`. Word count scales with `priority_score`: 600 → 1800 words.
2. **Full article — Opus.** Takes brief + source material + full_text, returns `{h1, subtitle, body_html, body_blocks, excerpt, suggested_tags, word_count}`. Allowed HTML tags: `h2, h3, p, blockquote, ul, li, strong, em, a` only. British English. No em-dashes. No urgency language. Cites sources inline. Fact-heavy (numbers, dates, percentages). If `article_type = 'earnings_preview'` or entities include tickers, inject a structured "Key numbers" table block.
3. **SEO pass — Sonnet.** Returns `{meta_title (55–60 chars), meta_description (155–160 chars), seo_keywords, faq_data (3–5 Q&A pairs, answers 2–3 sentences), schema_type: 'NewsArticle'}`.
4. **Internal link injection — Sonnet.** Given a curated list of link targets (entity pages + related articles from the last 14 days), inject 5–8 contextual `<a>` tags with natural anchor text. Run the deterministic fallback linker after Claude in case key entities were missed.

Other responsibilities:

- Sanitise editorial AI annotations out of the final HTML (regex for fact-check notes — copy SportSignals regexes at lines 413–439).
- Resolve/create tags on the fly (`post_tags`).
- Write `posts` row with `status='draft'`, `news_candidate_id` set, all entity FK arrays populated.
- Set `news_candidates.status='writing'` on claim; stay in `writing` until publish flips to `published`. Stale rows are reset by `release_stale_writing_candidates(20)` on a cron.

### 3.6 `news-images`

- Select drafts: `posts.status='draft' AND feature_image_url IS NULL`, up to 10 per run.
- Category → visual direction lookup. For business news, default directions:
  - `markets` → "trading floor, clean editorial photography, desaturated"
  - `earnings` → "flat editorial illustration of earnings chart, minimal"
  - `deals` → "two puzzle pieces meeting, editorial illustration"
  - `regulation` → "marble building columns, photorealistic, overcast"
  - `ai-tech` → "abstract neural network, clean vector, blue/teal"
  - `leadership` → "editorial portrait composition, neutral background"
  - fallback → brand colour card with logo watermark.
- Haiku call generates `{image_prompt, alt_text}` (temperature 0.8, max_tokens 500) with the category direction + article H1 + lead paragraph as context.
- Gemini call produces 1200×630. One retry after 2 s.
- Post-process with `imagescript`: cover-resize, centre-crop, JPEG quality 78.
- Upload to `news-images/{category-slug}/{ts}-{article-id}.jpg`, write public URL to `posts.feature_image_url` and `posts.feature_image_alt`.
- **Fallback**: SVG placeholder with category colour + BF logomark if generation fails twice. The pipeline must keep moving.

### 3.7 `news-publish`

- Select `posts.status='draft' AND feature_image_url IS NOT NULL`, up to 10.
- Haiku call generates a 5–7-word hyphenated slug. Numeric-suffix loop ensures `slug` uniqueness.
- `UPDATE posts SET status='published', published_at=now(), slug=…`.
- `UPDATE news_candidates SET status='published'` for the linked row.
- **IndexNow**: `POST https://api.indexnow.org/indexnow` with article URL + host + `INDEXNOW_API_KEY`. Verify with a public key file served at `/public/indexnow-key.txt` by Next.js.
- **ISR revalidate**: `POST https://www.businessfortitude.com/api/revalidate` with `paths: ['/', '/latest', '/category/<slug>', '/article/<slug>']` + bearer `VERCEL_REVALIDATE_TOKEN`.
- (Phase 2) Push notifications to followers of the article's entities.

### 3.8 Scheduling

In `pg_cron`:

```sql
SELECT cron.schedule('news-ingest',  '5 * * * *',  $$SELECT call_edge_fn('news-ingest-rss')$$);
SELECT cron.schedule('news-filter',  '15 * * * *', $$SELECT call_edge_fn('news-filter')$$);
SELECT cron.schedule('news-write',   '25 * * * *', $$SELECT call_edge_fn('news-write')$$);
SELECT cron.schedule('news-images',  '35 * * * *', $$SELECT call_edge_fn('news-images')$$);
SELECT cron.schedule('news-publish', '45 * * * *', $$SELECT call_edge_fn('news-publish')$$);
SELECT cron.schedule('release-stale','0 */6 * * *',$$SELECT release_stale_writing_candidates(20)$$);
```

`call_edge_fn()` is a helper that does `net.http_post` with the service-role key.

---

## 4. Prompt rewrites (business-news domain)

The SportSignals prompts assume football context. Rewrite each stage for business/finance.

### 4.1 Editorial rubric (for `news-filter`)

The rubric is the single longest prompt in the system (~2000 words). It must cover:

- **BF category slugs**: `markets`, `earnings`, `deals`, `regulation`, `leadership`, `ai-tech`, `economy`, `startups`, `energy`, `crypto`. Pick 7–10, keep them stable, mirror the `categories` table.
- **Newsworthiness scale (1–100)**:
  - 90–100: market-moving, named public company, hard number (earnings beat, M&A announcement, regulatory action).
  - 70–89: sector trend with at least one named company anchor.
  - 50–69: context / analysis piece with clear reader value.
  - 30–49: colour piece, weak primary source.
  - < 30: auto-reject.
- **Approval rules**: must have ≥1 named entity the BF readership tracks; must be within 48 hours unless it's an explainer; source domain must be on the allow-list (FT, Reuters, Bloomberg, WSJ, SEC filings, company press, tier-1 trade press).
- **Duplicate detection**: if the same story angle is already in the last-3-days context block (same companies + same event), mark `duplicate` with `duplicate_of_title`.
- **Rejection categories**: "already covered", "not our beat", "promotional", "speculation without source", "below quality threshold".

### 4.2 Article writer voice

Prompt constraints for the Opus article pass:

- Voice: informed, neutral, British English. Target reader is a busy founder, operator, or senior professional.
- Banned: em-dashes, "delve", "in today's fast-paced world", urgency marketing language, hype adjectives ("game-changing", "revolutionary"), 2nd-person ("you") outside explainers.
- Required: inline attribution on any claim ("according to the company's Q1 filing", "as first reported by Reuters"), specific numbers where available, published date context ("in the three months to March").
- Structure: H1 (set separately), subtitle, 2–4 H2 sections, optional H3 for sub-points. If a named executive features, include a single-sentence context line on their role. If public companies feature, include their ticker and exchange on first mention.

### 4.3 Compliance layer — **do not skip**

BF covers markets, companies, and tickers. That pulls in financial-promotion rules. Bake the following into every article prompt:

- **Never** recommend buying, selling, or holding any security.
- Every article mentioning a ticker must include, at the end, a boilerplate disclosure block: *"This article is for informational purposes only and is not investment advice. Business Fortitude does not hold positions in securities discussed unless explicitly stated."*
- Do not forecast prices. Attribute any quoted forecast to its source with date.
- Do not quote any real person saying something they did not say. Only quote when a source URL provides the direct quote verbatim.
- For UK readers: if content could be read as a financial promotion to retail investors (e.g. crypto pieces), append a second disclosure: *"Capital at risk. Past performance is not a reliable indicator of future results."*

Implementation: this goes into the system prompt of pass 2 as a "HARD CONSTRAINTS" block, and `news-publish` does a final regex check for the disclosure string before flipping status — if missing, it re-enqueues to writing with a `failed` reason.

### 4.4 Image prompt guardrails

- No photorealistic faces of named living people (even CEOs). For exec-focused pieces, prompt for "silhouette" or "anonymous editorial composition" or use a library portrait outside the pipeline.
- No logos of real companies (trademark risk). If the article is about Apple, the image is a clean illustration of the theme (e.g. "supply chain"), not an Apple logo.
- No currency symbols on charts (avoids implying financial advice).

---

## 5. Frontend — Next.js App Router map

New repo layout (relevant parts):

```
src/
  app/
    layout.tsx
    page.tsx                         # homepage
    latest/page.tsx                  # /latest
    article/[slug]/page.tsx          # /article/<slug>     (primary URL)
    category/[slug]/page.tsx         # /category/<slug>
    category/[slug]/[articleSlug]/page.tsx  # legacy redirect target
    author/[slug]/page.tsx
    tag/[slug]/page.tsx
    search/page.tsx
    about/page.tsx
    privacy/page.tsx
    terms/page.tsx
    cookie-policy/page.tsx
    account/page.tsx
    company/[slug]/page.tsx
    ticker/[symbol]/page.tsx
    person/[slug]/page.tsx
    sector/[slug]/page.tsx
    admin/
      layout.tsx
      page.tsx
      posts/page.tsx
      posts/new/page.tsx
      posts/[id]/edit/page.tsx
      categories/page.tsx
      tags/page.tsx
      authors/page.tsx
      pages/page.tsx
      pages/new/page.tsx
      pages/[id]/edit/page.tsx
      comments/page.tsx
      users/page.tsx
      settings/page.tsx
      pipeline/page.tsx              # NEW — observe the news engine
      feeds/page.tsx                 # NEW — manage rss_feeds
      candidates/page.tsx            # NEW — read-only view of news_candidates
    api/
      revalidate/route.ts            # bearer-auth ISR endpoint
      indexnow-key.txt/route.ts      # serves the IndexNow verification key
    sitemap.ts                       # primary sitemap
    news-sitemap.xml/route.ts        # Google News sitemap (1000 most recent)
    robots.ts
  lib/
    supabase/server.ts
    supabase/client.ts
    supabase/database.types.ts       # regenerate from new schema
    queries/articles.ts              # getLatestNews, getArticleBySlug, getRelatedArticles, getHeroArticle
    queries/entities.ts              # getCompanyBySlug, getTickerBySymbol, etc.
    queries/admin.ts
    entity-linker.ts                 # accent-strip + blocklist + rewrite
    entity-linker-cached.ts
    content/sanitise.ts              # strip stray <h1>, JSON-LD leaks
    schema/article-jsonld.ts
  components/                        # port shadcn/ui + BF custom components
```

**Route-level settings:**

| Route | `revalidate` | Notes |
|---|---|---|
| `/` | 60 s | Hero + latest strip |
| `/latest` | 60 s | |
| `/article/[slug]` | 300 s | Entity linker runs server-side |
| `/category/[slug]` | 300 s | |
| `/author/[slug]` | 300 s | |
| `/tag/[slug]` | 300 s | |
| `/company/[slug]` | 300 s | Filter `posts WHERE company_ids @> ARRAY[company.id]` |
| `/ticker/[symbol]` | 300 s | Filter by ticker_ids; include price widget from `stock_cache` |
| `/person/[slug]` | 600 s | |
| `/sector/[slug]` | 300 s | |
| `/news-sitemap.xml` | 3600 s | |

**URL compatibility.** The current site uses `/category/<cat-slug>/<article-slug>` as the canonical article URL. Keep `/article/<slug>` as canonical in the new site but add a redirect rule in `middleware.ts` or a dedicated `app/category/[slug]/[articleSlug]/page.tsx` that 301s to `/article/<articleSlug>`. Also populate `slug_redirects` with the old URLs for any changed slugs so nothing 404s.

**Admin.** The existing Vite admin (`src/pages/admin/*`) has a complete UI. For the big-bang cutover, **re-implement each admin page as a Next.js Server Component shell + Client Component form**. It's tedious but isolates well per-page. Reuse the shadcn/ui components and Tiptap editor verbatim. Auth remains Supabase Auth; use `@supabase/ssr` to propagate the session between server and client.

**Entity linker.** Port `src/lib/entity-linker.ts` from SportSignals (see §5 of the handoff). Blocklist for BF needs to include ambiguous tokens: `the company`, `market`, `shares`, `group`, `holdings`, `capital`, `partners`, `ventures`, single letters, and anything under 3 characters. Maintain this list in a `blocklist.ts` next to the linker.

---

## 6. Vercel + GitHub setup

**GitHub repo:** `axiasignalsgroup/business-fortitude` (private). Branches:

- `main` — production, auto-deploys to `businessfortitude.com`.
- `staging` — auto-deploys to `staging.businessfortitude.com` with a password-protected header.
- Feature branches → preview URLs.

**Required env vars** (set on Vercel + for Supabase Edge Functions):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY            # server + edge only
ANTHROPIC_API_KEY
GEMINI_API_KEY
INDEXNOW_API_KEY
VERCEL_REVALIDATE_TOKEN
SITE_URL                             # https://www.businessfortitude.com
```

**Cron host.** Schedule runs inside Supabase via `pg_cron` (see §3.8) — no Vercel Cron needed for the pipeline. Vercel is only serving pages.

**Repo scaffolding shortcut.** Use `create-next-app` with TypeScript + Tailwind + App Router, then:

1. Copy `src/components/ui`, `src/components/article`, `src/components/admin` from the Lovable export.
2. Copy `src/hooks`, `src/lib` (minus supabase integration files).
3. Re-generate Supabase types from the *new* schema with `supabase gen types typescript`.
4. Convert every `src/pages/*.tsx` into its `app/*/page.tsx` counterpart.

---

## 7. Big-bang cutover runbook

This is the sequence for cut-over night. Blocker-free prep should happen in the days before.

### Prep (any time before cutover)

1. Create new Supabase project: `business-fortitude-prod`. Save project URL + keys.
2. Create GitHub repo, scaffold Next.js app, push initial commit.
3. Link Vercel project to repo. Set env vars. Deploy a placeholder to verify the pipeline works.
4. Apply the schema migrations to the new Supabase project in order:
   - Baseline: re-run the 15 Lovable migrations (`supabase/migrations/*.sql`).
   - New: add the 20+ new migrations from §2 (one migration per logical change).
5. Port all 5 new edge functions + `_shared` helpers to `supabase/functions/`. Deploy them.
6. Set `pg_cron` schedules but leave `is_active = false` on all `rss_feeds` rows until cutover.
7. Seed data:
   - Copy `categories`, `authors`, `tags` from old Supabase (`pg_dump --data-only -t categories -t authors -t tags -t post_tags -t pages -t site_settings`).
   - Copy `posts` with `status='published'` and all their `post_tags`.
   - Seed `sectors` from a BF-curated list (~30 rows).
   - Seed `companies` + `tickers` from your existing company list (export from wherever it's tracked now — a CSV upload into Supabase is fine).
   - Seed `executives` lazily (can grow from articles over time, but start with the top ~50 in BF's beat).
   - Seed `rss_feeds` with BF's current feed list (URLs you were feeding into Make.com).
8. Build the 5 new admin pages (`/admin/pipeline`, `/admin/feeds`, `/admin/candidates`, plus re-implementations of existing admin pages).
9. On staging: trigger each edge function manually, confirm a candidate can flow end-to-end to a published article. Run the verification checklist in §8.

### Cutover window (T-0)

1. Freeze Make.com: disable all scenarios.
2. Re-export `posts` (including anything published between prep and cutover) → import into new Supabase, upserting by `slug`.
3. Freeze the old Supabase (revoke service-role key; optional).
4. Swap DNS: point `www.businessfortitude.com` and `businessfortitude.com` at Vercel. Add 301 from apex → www (or the reverse — pick one canonical).
5. In new Supabase: `UPDATE rss_feeds SET is_active = true;`.
6. Trigger the full pipeline manually once to avoid waiting for cron: `news-ingest-rss` → `news-filter` → `news-write` → `news-images` → `news-publish`.
7. Verify first auto-published article is live and indexed.
8. Submit new sitemap to Google Search Console: `https://www.businessfortitude.com/sitemap.xml` and `/news-sitemap.xml`.
9. Submit the IndexNow key file at `/indexnow-key.txt` to each search engine that supports it (Bing, Yandex).

### Post-cutover (T+24h)

1. Watch `/admin/pipeline` for stuck rows.
2. Spot-check 10 auto-published articles for: entity links resolve, compliance disclosure present, no broken HTML, image loads, JSON-LD validates in Google's Rich Results Test.
3. Compare 7-day publish volume vs. Make.com baseline. If down >30%, likely an RSS feed misconfiguration — check `rss_feeds.consecutive_failures`.
4. Decommission: pause Lovable deployment, export final Make.com scenarios as JSON for archive, delete Airtable base (after exporting a backup to workspace).

### Rollback plan

If something catastrophic happens inside the 24-hour window:

1. Point DNS back to Lovable (TTL-dependent).
2. Re-enable Make.com scenarios.
3. Old Supabase is still intact — re-grant service-role key.

Rollback is clean up to the DNS flip; after 24 h, any content published on the new stack has to be re-imported into old Supabase if you roll back — which makes rollback progressively more painful. Budget the cutover window for a Friday evening so you have the weekend to stabilise.

---

## 8. Verification checklist

Run these in the new environment before declaring cutover complete. Matches the SportSignals 7-point gate, adapted for BF.

1. **Ingest.** Insert one active row into `rss_feeds`. Trigger `news-ingest-rss`. Expect ≥1 `news_candidates.status='pending'` row and `rss_feeds.items_ingested > 0`.
2. **Filter.** Trigger `news-filter`. Expect candidates transition to `approved`/`rejected`/`duplicate` with `priority_score` and at least one `suggested_companies` entry populated.
3. **Write.** Trigger `news-write`. Expect a new `posts` row with `status='draft'`, `content_html` populated (>500 chars), `meta_title` 55–60 chars, `meta_description` 155–160 chars, `faq_data` with ≥3 entries, `company_ids` non-empty, `word_count` matching the target range, and the compliance disclosure string present.
4. **Images.** Trigger `news-images`. Expect `feature_image_url` set to a Supabase Storage URL that renders a 1200×630 JPEG in the browser.
5. **Publish.** Trigger `news-publish`. Expect `status='published'`, unique slug, IndexNow POST returns 200, Vercel revalidate POST returns 200.
6. **Render.** Load `/article/<slug>` directly. Confirm: entity links resolve to `/company/[slug]` / `/ticker/[symbol]` / `/person/[slug]` / `/sector/[slug]`; JSON-LD validates in a schema validator; no stray `<h1>` duplicates; compliance disclosure visible in the article body; page returns 200 with HTML rendered server-side (curl should return full markup).
7. **Failure modes.** Force failure in each stage:
   - Revoke `ANTHROPIC_API_KEY` temporarily → `news-filter` should set status `failed` and log, not crash the run.
   - Revoke `GEMINI_API_KEY` → `news-images` should fall through to the SVG placeholder.
   - Post a malformed feed URL to `rss_feeds` → `consecutive_failures` increments, feed auto-disables at 10.
   - Kill a `news-write` function mid-run → `release_stale_writing_candidates(20)` cron resets the stuck candidate back to `approved` within 6 h.

All seven pass ⇒ structurally equivalent to SportSignals.

---

## 9. Known sharp edges (BF-specific)

- **Slug-URL compatibility.** Old BF canonical is `/category/<cat>/<article>`; new canonical is `/article/<slug>`. You must populate `slug_redirects` (which already exists) for every published article at cutover, and implement 301s in `middleware.ts`. A missed redirect = SEO loss.
- **Compliance regex check.** If Claude forgets the disclosure block, `news-publish` must NOT flip to published. Add an automated regex check. Do not soften this — UK FCA financial promotion rules apply to BF-adjacent content.
- **Entity ambiguity is worse in business news than in football.** "Apple", "Amazon", "Meta", "Square", "Block", "Tesla" are all ambiguous across companies, common English words, or former names. The blocklist must be generous and the `aliases` column on every entity must be populated.
- **Ticker symbols collide across exchanges.** "BARC" is Barclays on LSE and something else on other exchanges. Always store with `(symbol, exchange)` and use the composite slug in URLs.
- **Stock price widget expectations.** Readers expect live prices on `/ticker/[symbol]`. The existing `stock-ticker` edge function + `stock_cache` table can stay; just connect them to the new route.
- **Admin re-implementation is the biggest person-day cost.** The Tiptap editor + all the forms need Next.js client-component wrappers. Budget real time here — don't try to shoehorn into one weekend.
- **Lovable tagger leftovers.** `lovable-tagger` and `@lovable.dev/cloud-auth-js` are still in `package.json`. Drop them in the new repo.
- **`make-post` retirement.** Delete this edge function after cutover. Its API key should be revoked.
- **No candidate-approval UI.** The filter AI is trusted. If BF decides that's too risky for a first-week launch, add a temporary "hold" queue: `status='approved'` AND `priority_score < 70` stay in `news_candidates` requiring a manual click-through before `news-write` picks them up. Remove once confidence is high.
- **Cost.** SportSignals runs Opus twice per article plus Sonnet twice. At BF's publish volume, this matters. The Opus brief-pass can be cut to Sonnet after a few weeks of quality observation — build the model choice into `_shared/news-ai.ts` as a per-call-site constant so it's a one-line swap.

---

## 10. File pointers — read these in this order

In the current Lovable export (input):

1. `supabase/migrations/*.sql` — existing schema.
2. `supabase/functions/make-post/index.ts` — the integration point being retired.
3. `src/App.tsx` — current routes.
4. `src/pages/*.tsx` — pages to port.
5. `src/integrations/supabase/*` — existing typed Supabase client.

In the SportSignals reference (at `/Users/dadams/code/sport-signals/`):

1. Pipeline spine: `supabase/functions/news-ingest-rss/index.ts` → `news-filter` → `news-write` → `news-images` → `news-publish`.
2. Shared helpers: `supabase/functions/_shared/news-ai.ts`, `gemini.ts`, `news-types.ts`.
3. Data model: `src/lib/supabase/database.types.ts` (articles, news_candidates, rss_feeds).
4. Query layer: `src/lib/queries/news.ts`.
5. Frontend: `src/app/news/page.tsx`, `src/app/news/[slug]/page.tsx`.
6. Entity linking: `src/lib/entity-linker.ts`.
7. Admin pipeline page: `src/app/admin/(dashboard)/pipeline/page.tsx`.
8. Sitemap: `src/app/news-sitemap.xml/route.ts`.

---

## 11. What this plan does NOT cover (yet)

Flagging explicitly so they don't get dropped:

- **Push notifications.** SportSignals has a `push-notify` function. For BF it's a phase-2 item — add after the core pipeline is stable.
- **Newsletter.** The existing `newsletter_subscribers` table suggests a mail flow. Out of scope for this migration; keep the table, leave the sending integration for later.
- **Comments moderation.** Comments carry over as-is (already in Supabase). No pipeline change.
- **Stock ticker data source.** Keep whatever feeds `stock-ticker` today; the migration doesn't need to touch it.
- **Image licensing / stock photo library.** For exec-focused pieces where AI-generated faces are off-limits, decide whether to integrate a library (Getty, Shutterstock) or accept illustrated-only. Needs a call.
- **Analytics.** If Lovable bundled analytics, decide on Plausible / Vercel Analytics / GA4 before cutover. Add in `app/layout.tsx`.

---

## Execution note for the agent running this plan

This document is the handoff. Build incrementally, test each stage end-to-end on staging before the cutover window, and keep the old stack running untouched until DNS flips. When a step succeeds, mark the matching task complete in TodoList; when a step uncovers a surprise, add a follow-up task rather than silently working around it. The old Lovable export under `bf-codebase/` is the read-only reference for behaviour the new site must preserve — do not modify it.
