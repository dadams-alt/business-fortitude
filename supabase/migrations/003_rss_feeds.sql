-- 003_rss_feeds.sql
-- Feed registry read by news-ingest-rss (§2.2, §3.3).
-- Table-only: no seed rows, no RLS (policies land in 006_rls.sql).

CREATE TABLE public.rss_feeds (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      text NOT NULL,
  url                       text NOT NULL UNIQUE,
  homepage_url              text,
  source_name               text NOT NULL,                 -- shown on article bylines
  category                  text,                          -- one of the BF verticals; NULL = uncategorised
  is_active                 boolean NOT NULL DEFAULT true,
  fetch_interval_minutes    int NOT NULL DEFAULT 60,
  last_fetched_at           timestamptz,
  last_error                text,
  last_status_code          int,
  consecutive_failure_count int NOT NULL DEFAULT 0,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rss_feeds
  ADD CONSTRAINT rss_feeds_fetch_interval_positive
  CHECK (fetch_interval_minutes > 0);

CREATE TRIGGER trg_rss_feeds_updated_at
  BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Scheduler query shape: `WHERE is_active = true AND
-- (last_fetched_at IS NULL OR last_fetched_at < now() - interval …)
-- ORDER BY last_fetched_at NULLS FIRST`. NULLS FIRST ensures
-- never-polled feeds get picked up on the very first scheduler tick.
CREATE INDEX idx_rss_feeds_active_next_fetch
  ON public.rss_feeds (is_active, last_fetched_at NULLS FIRST);
