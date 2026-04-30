-- supabase/seed/fix_index_ventures_alias.sql
-- Fix: 'Index' is too broad an alias for index-ventures. It matches
-- "FTSE Index", "tech index", and any other index-as-common-noun
-- usage. Drop the alias and prune the false-positive article_entities
-- rows it created in the 2026-04-29 backfill (commit c9f409e).
--
-- Idempotent: re-running has no effect once the alias is gone and
-- the false-positive rows are deleted.
--
-- Apply: supabase db query --linked --file supabase/seed/fix_index_ventures_alias.sql

BEGIN;

-- 1. Drop the over-broad alias from the seed row.
UPDATE companies
SET aliases = array_remove(aliases, 'Index')
WHERE slug = 'index-ventures';

-- 2. Capture the count of index-ventures tags BEFORE the prune.
SELECT 'before' AS phase, count(*) AS index_ventures_tags
FROM article_entities ae
JOIN companies c ON c.id = ae.entity_id
WHERE ae.entity_type = 'company' AND c.slug = 'index-ventures';

-- 3. Delete false-positive tags: any article tagged with
-- index-ventures whose body_md doesn't actually contain
-- "Index Ventures" as a phrase (case-insensitive, word-boundary).
DELETE FROM article_entities ae
USING articles a, companies c
WHERE ae.article_id = a.id
  AND ae.entity_type = 'company'
  AND ae.entity_id = c.id
  AND c.slug = 'index-ventures'
  AND a.body_md !~* '\mindex ventures\M';

-- 4. Capture the count AFTER.
SELECT 'after' AS phase, count(*) AS index_ventures_tags
FROM article_entities ae
JOIN companies c ON c.id = ae.entity_id
WHERE ae.entity_type = 'company' AND c.slug = 'index-ventures';

COMMIT;
