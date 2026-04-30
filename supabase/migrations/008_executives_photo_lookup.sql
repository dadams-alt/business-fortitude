-- 008_executives_photo_lookup.sql
-- Adds a timestamp column entity-enrich uses to gate Wikipedia photo
-- retries. Without this, every drain re-queries the same ~44 executives
-- Wikipedia has no thumbnail for, wasting ~30s of API time per run.
--
-- 30-day retry window: long enough that Wikipedia adding a photo will
-- be picked up on a subsequent run, short enough that we don't go
-- forever without trying again.

ALTER TABLE public.executives
  ADD COLUMN photo_lookup_attempted_at timestamptz;

COMMENT ON COLUMN public.executives.photo_lookup_attempted_at IS
  'Set by entity-enrich after each Wikipedia photo lookup attempt (success or miss). entity-enrich gates re-tries on this so unmatched executives are not re-queried on every drain.';
