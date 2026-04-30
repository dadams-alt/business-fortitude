-- supabase/seed/rss_feeds_v2.sql
-- Replacement / additional RSS feeds, probed 2026-04-30. Only feeds
-- that returned valid RSS / Atom under either a browser UA or our
-- pipeline's feed-reader UA are seeded.
--
-- Yield was thin: 3 of 13 candidates probed cleanly. Funding category
-- candidates (Finextra, Innovate Finance, BVCA) all failed — Finextra
-- and Innovate Finance returned HTML (no RSS), BVCA 404'd. Filed
-- against the 'no replacement found' backlog.
--
-- Idempotent via ON CONFLICT (url) DO NOTHING.
-- Apply: supabase db query --linked --file supabase/seed/rss_feeds_v2.sql

INSERT INTO public.rss_feeds (name, source_name, url, homepage_url, category, fetch_interval_minutes)
VALUES
  -- regional: London-only but real, fills the regional gap (BusinessCloud was our only one).
  ('London Loves Business', 'London Loves Business',
   'https://londonlovesbusiness.com/feed/',
   'https://londonlovesbusiness.com',
   'regional', 60),

  -- sector: Personnel Today covers HR + employment law for UK SMEs and scale-ups.
  ('Personnel Today',       'Personnel Today',
   'https://www.personneltoday.com/feed/',
   'https://www.personneltoday.com',
   'sector', 120),

  -- sector: Logistics Manager covers UK supply chain + last-mile + warehouse operations.
  ('Logistics Manager',     'Logistics Manager',
   'https://www.logisticsmanager.com/feed/',
   'https://www.logisticsmanager.com',
   'sector', 120)

ON CONFLICT (url) DO NOTHING;
