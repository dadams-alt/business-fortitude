-- 013_admin_observability.sql
-- Admin-only RPCs for the /admin/pipeline view. cron.job and
-- net._http_response live in extension schemas where postgrest can't
-- reach them directly; SECURITY DEFINER wrappers in public expose
-- exactly the columns the admin view needs.
--
-- Grants are tight: service_role only. The admin frontend already
-- uses createServiceClient() for these queries, and middleware gates
-- on user_roles.admin before that view renders.

CREATE OR REPLACE FUNCTION public.admin_list_cron_jobs()
RETURNS TABLE (
  jobid    bigint,
  jobname  text,
  schedule text,
  active   boolean,
  command  text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.jobid, j.jobname, j.schedule, j.active, j.command
  FROM cron.job j
  WHERE j.jobname IN (
    'news-ingest', 'news-filter', 'news-write',
    'news-images', 'news-publish', 'release-stale'
  )
  ORDER BY j.jobname;
$$;

CREATE OR REPLACE FUNCTION public.admin_recent_cron_runs(p_limit int DEFAULT 25)
RETURNS TABLE (
  jobid          bigint,
  jobname        text,
  status         text,
  return_message text,
  start_time     timestamptz,
  end_time       timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rd.jobid,
    j.jobname,
    rd.status,
    rd.return_message,
    rd.start_time,
    rd.end_time
  FROM cron.job_run_details rd
  JOIN cron.job j ON j.jobid = rd.jobid
  WHERE j.jobname IN (
    'news-ingest', 'news-filter', 'news-write',
    'news-images', 'news-publish', 'release-stale'
  )
  ORDER BY rd.start_time DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.admin_recent_http_responses(p_limit int DEFAULT 50)
RETURNS TABLE (
  id           bigint,
  status_code  int,
  content_type text,
  content      text,
  created      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.status_code,
    r.content_type,
    r.content::text,
    r.created
  FROM net._http_response r
  ORDER BY r.created DESC
  LIMIT p_limit;
$$;

ALTER FUNCTION public.admin_list_cron_jobs() OWNER TO postgres;
ALTER FUNCTION public.admin_recent_cron_runs(int) OWNER TO postgres;
ALTER FUNCTION public.admin_recent_http_responses(int) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.admin_list_cron_jobs()         FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_recent_cron_runs(int)    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_recent_http_responses(int) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs()         TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_recent_cron_runs(int)    TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_recent_http_responses(int) TO service_role;
