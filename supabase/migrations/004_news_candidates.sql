-- 004_news_candidates.sql
-- Candidate queue between ingest and write (§2.3, §2.5).
-- Status lifecycle: pending → ready → writing → published
--                        └──→ rejected / duplicate
--                              (writing → failed on permanent failure)
-- Note: plan §2.3 uses 'approved' for the post-filter state; renamed to
-- 'ready' per current spec so release_stale_writing_candidates can unstick
-- claimed rows back onto the write queue.

CREATE TABLE public.news_candidates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_title          text NOT NULL,
  source_url            text UNIQUE,
  source_feed           uuid,                                     -- FK below
  source_pub_date       timestamptz,
  source_author         text,
  source_summary        text,
  full_text             text,
  content_hash          text UNIQUE,                              -- sha256(normalised title)
  status                text NOT NULL DEFAULT 'pending',
  priority_score        int,
  suggested_category    text,
  suggested_companies   uuid[] NOT NULL DEFAULT '{}',
  suggested_tickers     uuid[] NOT NULL DEFAULT '{}',
  suggested_executives  uuid[] NOT NULL DEFAULT '{}',
  suggested_sectors     uuid[] NOT NULL DEFAULT '{}',
  rejection_reason      text,
  claimed_at            timestamptz,
  claimed_by            text,
  article_id            uuid,                                     -- FK added in 005_articles.sql
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_candidates_status_valid CHECK (
    status IN ('pending','ready','writing','published','rejected','duplicate','failed')
  )
);

ALTER TABLE public.news_candidates
  ADD CONSTRAINT news_candidates_source_feed_fkey
  FOREIGN KEY (source_feed) REFERENCES public.rss_feeds(id)
  ON DELETE SET NULL;

-- Primary work-queue index. ORDER BY matches claim_news_candidates.
CREATE INDEX idx_news_candidates_status_priority
  ON public.news_candidates (status, priority_score DESC NULLS LAST, created_at ASC);

-- For release_stale lookups.
CREATE INDEX idx_news_candidates_claimed_at
  ON public.news_candidates (claimed_at)
  WHERE status = 'writing';


-- RPC: claim_news_candidates
-- Atomically moves up to `batch_size` rows from 'ready' → 'writing' and
-- stamps claimed_at + claimed_by. FOR UPDATE SKIP LOCKED lets multiple
-- workers pull disjoint batches concurrently without contention.
CREATE OR REPLACE FUNCTION public.claim_news_candidates(
  batch_size int,
  worker_id  text
)
RETURNS SETOF public.news_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.news_candidates c
     SET status     = 'writing',
         claimed_at = now(),
         claimed_by = worker_id
    FROM (
      SELECT id
        FROM public.news_candidates
       WHERE status = 'ready'
       ORDER BY priority_score DESC NULLS LAST, created_at ASC
       LIMIT batch_size
       FOR UPDATE SKIP LOCKED
    ) picked
   WHERE c.id = picked.id
  RETURNING c.*;
END;
$$;

-- RPC: release_stale_writing_candidates
-- Unsticks rows whose worker died mid-write (e.g. edge function timeout).
-- Returns count of rows released so a scheduled job can alert on spikes.
CREATE OR REPLACE FUNCTION public.release_stale_writing_candidates(
  max_age_minutes int DEFAULT 30
)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH released AS (
    UPDATE public.news_candidates
       SET status     = 'ready',
           claimed_at = NULL,
           claimed_by = NULL
     WHERE status = 'writing'
       AND claimed_at < now() - make_interval(mins => max_age_minutes)
    RETURNING 1
  )
  SELECT count(*)::int FROM released;
$$;

-- Ownership + execute grants.
-- Functions are created as the migration role (postgres on Supabase), but
-- ALTER OWNER makes the intent explicit. RLS-bypass via SECURITY DEFINER
-- only works safely when the owner is a trusted superuser — postgres is.
ALTER FUNCTION public.claim_news_candidates(int, text) OWNER TO postgres;
ALTER FUNCTION public.release_stale_writing_candidates(int) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.claim_news_candidates(int, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_stale_writing_candidates(int) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_news_candidates(int, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stale_writing_candidates(int) TO service_role;
