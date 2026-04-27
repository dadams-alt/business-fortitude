-- 001_extensions.sql
-- Enable extensions required by the news pipeline.
-- pg_cron: schedules the 5-stage edge function pipeline (§3.8).
-- pg_net: used by cron jobs to call edge functions via net.http_post (§3.8).
-- Supabase places both in the `extensions` schema by default; IF NOT EXISTS
-- keeps this migration idempotent if Supabase already enabled either.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
