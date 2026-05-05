-- 014_add_replacement_feeds.sql
-- Three additional feeds to fill thin coverage in regional, sector, and
-- fintech beats. Personnel Today (HR/people) is already in the registry
-- from an earlier data step, so it is omitted here.
--
-- Each URL was probed with User-Agent BusinessFortitudeBot/1.0 before
-- this migration: Bdaily 200/text-xml, Computer Weekly 200/application-xml,
-- Finextra 200/text-xml. ON CONFLICT (url) is a defensive guard for
-- re-runs and parallel-environment sync.

INSERT INTO public.rss_feeds
  (name, url, homepage_url, source_name, category,
   is_active, fetch_interval_minutes)
VALUES
  ('Bdaily',
   'https://bdaily.co.uk/rss',
   'https://bdaily.co.uk/',
   'Bdaily',
   'regional',
   true,
   60),
  ('Computer Weekly',
   'https://www.computerweekly.com/rss/All-Computer-Weekly-content.xml',
   'https://www.computerweekly.com/',
   'Computer Weekly',
   'sector',
   true,
   60),
  ('Finextra',
   'https://www.finextra.com/rss/headlines.aspx',
   'https://www.finextra.com/',
   'Finextra',
   'sector',
   true,
   60)
ON CONFLICT (url) DO NOTHING;
