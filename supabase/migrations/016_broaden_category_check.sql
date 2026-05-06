-- 016_broaden_category_check.sql
-- The legacy Lovable catalog uses 8 archival category slugs that don't
-- match the autonomous pipeline's 7 canonical ones. To preserve the old
-- /category/<slug>/<article-slug> URLs after the DNS cutover, we keep
-- the legacy slugs as valid 'category' values for those imported rows.
-- The static src/lib/data/categories.ts adds matching entries so the
-- /category/[slug] route renders for each old slug.
--
-- Idempotent: DROP IF EXISTS guards the constraint recreation.

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_category_valid;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_category_valid
  CHECK (category = ANY (ARRAY[
    -- Canonical (autonomous pipeline)
    'markets',
    'deals',
    'leadership',
    'ai',
    'startups',
    'regulation',
    'opinion',
    -- Legacy (Lovable archive — preserved verbatim)
    'marketing-growth',
    'finance-economy',
    'industry-watch',
    'leadership-people',
    'policy-regulation',
    'news',
    'tech-innovation',
    'opinion-analysis'
  ]));
