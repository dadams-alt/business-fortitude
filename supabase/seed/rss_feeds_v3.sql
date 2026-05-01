-- supabase/seed/rss_feeds_v3.sql
-- Funding gap probe round 2 (2026-05-01). 12 candidates tried —
-- 2 survived. The funding category is genuinely under-served by
-- public RSS feeds; most VC / private-markets news lives behind
-- WAFs (Pitchbook, EU-Startups, DealRoom, PE News) or has retired
-- their RSS (FT Adviser, BVCA, AltFi).
--
-- Survivors:
-- - TechCrunch Venture: global venture-funding wire. Heavy US bias
--   but UK-relevant when European rounds land.
-- - Crunchbase News: funding-round summaries with named companies.
--
-- Idempotent via ON CONFLICT (url) DO NOTHING.
-- Apply: supabase db query --linked --file supabase/seed/rss_feeds_v3.sql

INSERT INTO public.rss_feeds (name, source_name, url, homepage_url, category, fetch_interval_minutes)
VALUES
  ('TechCrunch Venture', 'TechCrunch',
   'https://techcrunch.com/category/venture/feed/',
   'https://techcrunch.com/category/venture',
   'funding', 60),

  ('Crunchbase News', 'Crunchbase',
   'https://news.crunchbase.com/feed',
   'https://news.crunchbase.com',
   'funding', 60)

ON CONFLICT (url) DO NOTHING;
