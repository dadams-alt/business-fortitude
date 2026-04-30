-- supabase/seed/article_entities_backfill.sql
-- Retroactive entity tagging for already-published articles.
--
-- Pre-pipeline articles (those drafted before the entity tables were
-- seeded) had empty news_candidates.suggested_* arrays at write time, so
-- they shipped with no article_entities rows. This script regex-matches
-- entity names + aliases against article body_md and inserts the
-- relationships.
--
-- Idempotent via the composite PK on (article_id, entity_type, entity_id).
-- Safe to re-run; ON CONFLICT DO NOTHING.
--
-- Apply: supabase db query --linked --file supabase/seed/article_entities_backfill.sql
--
-- Caveats:
-- - Aliases shorter than the threshold are skipped to reduce false
--   positives (4 chars for companies, 6 chars for executives).
-- - Word-boundary anchors \m \M used to avoid substring hits ("Apple"
--   inside "applet").
-- - Special regex characters in names are escaped via regexp_replace.
-- - Manual review of the per-entity tag counts is recommended; if a
--   single entity tags 30+ articles, that's a likely false-positive
--   signal worth investigating.

-- Companies: name + aliases >= 4 chars
INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT DISTINCT a.id, 'company', c.id
FROM articles a
CROSS JOIN companies c
WHERE a.status = 'published'
  AND a.body_md IS NOT NULL
  AND (
    a.body_md ~* ('\m' || regexp_replace(c.name, '([().+*?\[\]\\^$|])', '\\\1', 'g') || '\M')
    OR EXISTS (
      SELECT 1 FROM unnest(c.aliases) AS alias
      WHERE length(alias) >= 4
        AND a.body_md ~* ('\m' || regexp_replace(alias, '([().+*?\[\]\\^$|])', '\\\1', 'g') || '\M')
    )
  )
ON CONFLICT DO NOTHING;

-- Executives: name + aliases >= 6 chars (first names alone create false positives)
INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT DISTINCT a.id, 'executive', e.id
FROM articles a
CROSS JOIN executives e
WHERE a.status = 'published'
  AND a.body_md IS NOT NULL
  AND (
    a.body_md ~* ('\m' || regexp_replace(e.name, '([().+*?\[\]\\^$|])', '\\\1', 'g') || '\M')
    OR EXISTS (
      SELECT 1 FROM unnest(e.aliases) AS alias
      WHERE length(alias) >= 6
        AND a.body_md ~* ('\m' || regexp_replace(alias, '([().+*?\[\]\\^$|])', '\\\1', 'g') || '\M')
    )
  )
ON CONFLICT DO NOTHING;

-- Sectors: name match only (slugs are too vague to scan for)
INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT DISTINCT a.id, 'sector', s.id
FROM articles a
CROSS JOIN sectors s
WHERE a.status = 'published'
  AND a.body_md IS NOT NULL
  AND a.body_md ~* ('\m' || regexp_replace(s.name, '([().+*?\[\]\\^$|])', '\\\1', 'g') || '\M')
ON CONFLICT DO NOTHING;

-- Tickers: match the canonical "EXCHANGE:SYMBOL" form (with optional space + closing paren)
INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT DISTINCT a.id, 'ticker', t.id
FROM articles a
CROSS JOIN tickers t
WHERE a.status = 'published'
  AND a.body_md IS NOT NULL
  AND (
    a.body_md ~* (t.exchange || ':\s*' || t.symbol)
    OR a.body_md ~* (t.exchange || ':\s*' || t.symbol || '\)')
  )
ON CONFLICT DO NOTHING;
