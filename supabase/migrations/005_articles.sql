-- 005_articles.sql
-- Articles table + article_entities join (§2.1 extended; entities via join
-- table instead of the plan's uuid[] arrays for cleaner querying).
-- Also back-fills news_candidates.article_id FK deferred from 004.

CREATE TABLE public.articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  title               text NOT NULL,
  subtitle            text,                             -- deck / standfirst
  lead                text,                             -- paragraph under headline
  body_md             text NOT NULL,                    -- markdown; rendered at build time
  hero_image_url      text,
  hero_image_alt      text,
  hero_image_credit   text,
  category            text NOT NULL,
  author_name         text,                             -- authors table deferred
  author_slug         text,
  status              text NOT NULL DEFAULT 'draft',
  published_at        timestamptz,
  meta_title          text,
  meta_description    text,
  source_candidate_id uuid,                             -- FK below
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT articles_category_valid CHECK (
    category IN ('markets','deals','leadership','ai','startups','regulation','opinion')
  ),
  CONSTRAINT articles_status_valid CHECK (
    status IN ('draft','review','published','archived')
  )
);

ALTER TABLE public.articles
  ADD CONSTRAINT articles_source_candidate_id_fkey
  FOREIGN KEY (source_candidate_id) REFERENCES public.news_candidates(id)
  ON DELETE SET NULL;

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- article_entities: many-to-many with mixed-type entity_id.
-- entity_id is deliberately NOT a formal FK — it points into one of four
-- entity tables depending on entity_type. Application code is responsible
-- for referential integrity. Enforced by the entity-linker + admin UI.

CREATE TABLE public.article_entities (
  article_id  uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  PRIMARY KEY (article_id, entity_type, entity_id),
  CONSTRAINT article_entities_type_valid CHECK (
    entity_type IN ('company','ticker','executive','sector')
  )
);

ALTER TABLE public.article_entities
  ADD CONSTRAINT article_entities_article_id_fkey
  FOREIGN KEY (article_id) REFERENCES public.articles(id)
  ON DELETE CASCADE;

-- Reverse lookup: "all articles that mention entity X" — drives
-- /company/[slug], /ticker/[symbol], /person/[slug], /sector/[slug].
CREATE INDEX idx_article_entities_entity
  ON public.article_entities (entity_type, entity_id);


-- Back-fill the news_candidates.article_id FK that 004 could not declare
-- because articles did not yet exist.
ALTER TABLE public.news_candidates
  ADD CONSTRAINT news_candidates_article_id_fkey
  FOREIGN KEY (article_id) REFERENCES public.articles(id)
  ON DELETE SET NULL;


-- Feed indexes. Partial WHERE status='published' keeps them small — drafts
-- and archived rows never hit these lookups.
CREATE INDEX idx_articles_published_feed
  ON public.articles (published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_articles_category_published
  ON public.articles (category, published_at DESC)
  WHERE status = 'published';
