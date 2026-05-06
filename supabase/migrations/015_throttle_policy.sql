-- 015_throttle_policy.sql
-- Three throttling levers for the autonomous pipeline:
--   C. Priority threshold — claim_news_candidates gains a min_priority
--      parameter (default 0, preserving every existing caller). news-write
--      passes 70 to refuse low-priority work at the queue level.
--   D. TTL — expire_stale_ready_candidates(p_age_days) auto-rejects
--      'ready' rows older than N days; cron runs it daily at 06:00 UTC.
--   E. One-off backlog drain — rejects existing 'ready' rows older than
--      48h to clear the post-policy-change overhang.
--
-- The B lever (daily cap) is application-side, in news-write. See
-- supabase/functions/news-write/index.ts.
--
-- The news_candidates table has no processed_at column, so rejection
-- updates set status + rejection_reason only. claimed_at / claimed_by
-- are not relevant for ready→rejected transitions and stay NULL.

-- ---------------------------------------------------------------
-- C. claim_news_candidates with min_priority parameter
-- ---------------------------------------------------------------
-- DROP + CREATE rather than CREATE OR REPLACE so that the function has a
-- single signature on disk: PostgREST RPC then dispatches unambiguously
-- whether the caller passes min_priority or not (it defaults to 0).

DROP FUNCTION IF EXISTS public.claim_news_candidates(int, text);

CREATE OR REPLACE FUNCTION public.claim_news_candidates(
  batch_size   int,
  worker_id    text,
  min_priority int DEFAULT 0
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
         AND COALESCE(priority_score, 0) >= min_priority
       ORDER BY priority_score DESC NULLS LAST, created_at ASC
       LIMIT batch_size
       FOR UPDATE SKIP LOCKED
    ) picked
   WHERE c.id = picked.id
  RETURNING c.*;
END;
$$;

ALTER FUNCTION public.claim_news_candidates(int, text, int) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.claim_news_candidates(int, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_news_candidates(int, text, int) TO service_role;

-- ---------------------------------------------------------------
-- D. expire_stale_ready_candidates + daily cron
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_ready_candidates(p_age_days int)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH expired AS (
    UPDATE public.news_candidates
       SET status = 'rejected',
           rejection_reason = 'stale: ready > ' || p_age_days || ' days'
     WHERE status = 'ready'
       AND created_at < now() - make_interval(days => p_age_days)
    RETURNING 1
  )
  SELECT count(*)::int FROM expired;
$$;

ALTER FUNCTION public.expire_stale_ready_candidates(int) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.expire_stale_ready_candidates(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_ready_candidates(int) TO service_role;

-- Idempotent cron registration. cron.alter_job updates an existing
-- schedule in place (preserving job_id); cron.schedule creates a new one.
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'expire-stale-ready';
  IF v_jobid IS NULL THEN
    PERFORM cron.schedule(
      'expire-stale-ready',
      '0 6 * * *',
      $cmd$SELECT public.expire_stale_ready_candidates(5)$cmd$
    );
  ELSE
    PERFORM cron.alter_job(
      job_id   => v_jobid,
      schedule => '0 6 * * *',
      command  => $cmd$SELECT public.expire_stale_ready_candidates(5)$cmd$
    );
  END IF;
END $$;

-- ---------------------------------------------------------------
-- E. One-off backlog drain
-- ---------------------------------------------------------------
-- Re-running this migration is a no-op because the targeted rows are
-- already 'rejected' on the second pass. RAISE NOTICE so the apply log
-- shows how many rows were drained.

DO $$
DECLARE
  v_before int;
  v_after  int;
  v_drained int;
BEGIN
  SELECT count(*) INTO v_before
    FROM public.news_candidates
   WHERE status = 'ready'
     AND created_at < now() - interval '48 hours';

  UPDATE public.news_candidates
     SET status = 'rejected',
         rejection_reason = 'backlog drain: policy change to 5/day cap + priority >=70 threshold (2026-05-06)'
   WHERE status = 'ready'
     AND created_at < now() - interval '48 hours';

  GET DIAGNOSTICS v_drained = ROW_COUNT;

  SELECT count(*) INTO v_after
    FROM public.news_candidates
   WHERE status = 'ready'
     AND created_at < now() - interval '48 hours';

  RAISE NOTICE 'backlog drain: pre=%; drained=%; post=%', v_before, v_drained, v_after;
END $$;
