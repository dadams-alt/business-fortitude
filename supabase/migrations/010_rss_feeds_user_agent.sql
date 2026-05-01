-- 010_rss_feeds_user_agent.sql
-- Adds an optional per-feed User-Agent override. NULL falls through to
-- the news-ingest-rss default (BusinessFortitudeBot/1.0). Use only
-- when a publisher's WAF rejects the default — Marketing Week was
-- the original 403 case that motivated this column.

ALTER TABLE public.rss_feeds ADD COLUMN user_agent text;

COMMENT ON COLUMN public.rss_feeds.user_agent IS
  'Optional override for the User-Agent header used when fetching this feed. NULL means use the function default (BusinessFortitudeBot/1.0). Use only when a publisher WAF rejects the default.';
