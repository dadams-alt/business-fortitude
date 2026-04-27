-- 006_rls.sql
-- Enable RLS on every table and declare explicit policies.
--
-- Access model:
--   service_role  → full access everywhere (edge functions + admin API).
--   anon / authenticated → read-only, and only on public-facing data:
--     entity tables (always), articles (published only), article_entities.
--   rss_feeds + news_candidates → no anon/authenticated access at all.
--
-- Note on service_role policies: the Supabase service_role key bypasses RLS
-- by default, so the FOR ALL policies below are technically redundant. They
-- are kept for explicitness — a future role rename or policy review can
-- read intent directly from the policy list without chasing framework
-- behaviour.
--
-- Admin-role machinery (app_role enum, user_roles, has_role()) is NOT
-- created here. Those arrive with the admin UI in a later migration.


-- rss_feeds ----------------------------------------------------------------
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY rss_feeds_service_role_all
  ON public.rss_feeds
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- news_candidates ----------------------------------------------------------
ALTER TABLE public.news_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY news_candidates_service_role_all
  ON public.news_candidates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- companies ----------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_service_role_all
  ON public.companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY companies_public_read
  ON public.companies
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- tickers ------------------------------------------------------------------
ALTER TABLE public.tickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tickers_service_role_all
  ON public.tickers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY tickers_public_read
  ON public.tickers
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- executives ---------------------------------------------------------------
ALTER TABLE public.executives ENABLE ROW LEVEL SECURITY;

CREATE POLICY executives_service_role_all
  ON public.executives
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY executives_public_read
  ON public.executives
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- sectors ------------------------------------------------------------------
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY sectors_service_role_all
  ON public.sectors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY sectors_public_read
  ON public.sectors
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- articles -----------------------------------------------------------------
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY articles_service_role_all
  ON public.articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY articles_public_read_published
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');


-- article_entities ---------------------------------------------------------
-- We're not filtering by parent article status here because the cost of
-- joining to articles on every read is high and article_entities on its
-- own leaks no content. Revisit if that assumption breaks.
ALTER TABLE public.article_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_entities_service_role_all
  ON public.article_entities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY article_entities_public_read
  ON public.article_entities
  FOR SELECT
  TO anon, authenticated
  USING (true);
