-- 007_cron.sql
-- Wires pg_cron schedules for the autonomous news pipeline.
--
-- pg_cron + pg_net are enabled in 001_extensions.sql.
-- public.call_edge_fn(fn_name) is a SECURITY DEFINER helper that does
-- a net.http_post to the named Supabase Edge Function with the
-- service-role JWT as bearer. The JWT is NOT inlined here — it lives
-- in supabase_vault as 'service_role_key' and is fetched per call.
-- The vault secret is set OUT OF BAND by an operator after this
-- migration applies (see deploy notes).
--
-- release_stale_writing_candidates(p_age_minutes int) already exists
-- from migration 004. Cron just calls it on a 6h cadence.

CREATE OR REPLACE FUNCTION public.call_edge_fn(fn_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret
    INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'service_role_key'
   LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'service_role_key not set in supabase_vault — cron cannot call edge functions';
  END IF;

  SELECT net.http_post(
    url := 'https://lsdjxhqocslefawseotl.supabase.co/functions/v1/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

ALTER FUNCTION public.call_edge_fn(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.call_edge_fn(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.call_edge_fn(text) TO postgres;

-- Drop any prior schedules with the same names. Idempotent re-runs:
-- cron.unschedule errors if the job doesn't exist, so guard with a
-- conditional.
DO $$
DECLARE
  jobnames text[] := ARRAY[
    'news-ingest', 'news-filter', 'news-write',
    'news-images', 'news-publish', 'release-stale'
  ];
  jn text;
BEGIN
  FOREACH jn IN ARRAY jobnames LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = jn) THEN
      PERFORM cron.unschedule(jn);
    END IF;
  END LOOP;
END $$;

-- Pipeline schedule. Each stage runs once per hour at its own minute,
-- staggered by 10 minutes so each downstream stage sees the previous
-- stage's output before it runs.
SELECT cron.schedule('news-ingest',  '5 * * * *',
  $$SELECT public.call_edge_fn('news-ingest-rss')$$);

SELECT cron.schedule('news-filter',  '15 * * * *',
  $$SELECT public.call_edge_fn('news-filter')$$);

SELECT cron.schedule('news-write',   '25 * * * *',
  $$SELECT public.call_edge_fn('news-write')$$);

SELECT cron.schedule('news-images',  '35 * * * *',
  $$SELECT public.call_edge_fn('news-images')$$);

SELECT cron.schedule('news-publish', '45 * * * *',
  $$SELECT public.call_edge_fn('news-publish')$$);

-- Stale-writing reset every 6h. 20-minute age threshold means anything
-- claimed but unfinished after a full edge-function timeout window
-- gets unstuck.
SELECT cron.schedule('release-stale', '0 */6 * * *',
  $$SELECT public.release_stale_writing_candidates(20)$$);
