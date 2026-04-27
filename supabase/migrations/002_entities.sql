-- 002_entities.sql
-- Entity tables: companies, tickers, executives, sectors (§2.4).
-- Every entity shares: id, name, slug (unique), aliases (text[]), timestamps.
-- Intra-entity foreign keys are added at the bottom of the file, after all
-- four tables exist, to avoid forward references between tickers and
-- companies. Article ↔ entity joins live in 005_articles.sql.

CREATE TABLE public.companies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,
  aliases           text[] NOT NULL DEFAULT '{}',
  description       text,
  logo_url          text,
  website_url       text,
  hq_country        text,
  founded_year      int,
  is_public         boolean NOT NULL DEFAULT false,
  primary_ticker_id uuid,                            -- FK added later
  sector_ids        uuid[] NOT NULL DEFAULT '{}',    -- array, not FK
  meta_title        text,
  meta_description  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tickers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,                          -- "Apple Inc. Common Stock"
  slug       text UNIQUE NOT NULL,                   -- "nasdaq-aapl"
  aliases    text[] NOT NULL DEFAULT '{}',
  symbol     text NOT NULL,                          -- "AAPL"
  exchange   text NOT NULL,                          -- "NASDAQ", "LSE"
  company_id uuid,                                   -- FK added later
  currency   text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (symbol, exchange)
);

CREATE TABLE public.executives (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  slug               text UNIQUE NOT NULL,
  aliases            text[] NOT NULL DEFAULT '{}',
  role               text,                           -- "CEO", "CFO", "Chair"
  current_company_id uuid,                           -- FK added later
  bio                text,
  photo_url          text,
  linkedin_url       text,
  twitter_url        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sectors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,                    -- "Artificial Intelligence"
  slug             text UNIQUE NOT NULL,             -- "ai"
  aliases          text[] NOT NULL DEFAULT '{}',
  description      text,
  parent_sector_id uuid,                             -- self-ref FK added below
  meta_title       text,
  meta_description text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Intra-entity foreign keys. ON DELETE SET NULL so deleting one side
-- doesn't cascade across the entity graph — orphaned references become
-- NULL and can be re-pointed by editorial.

ALTER TABLE public.tickers
  ADD CONSTRAINT tickers_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE SET NULL;

ALTER TABLE public.executives
  ADD CONSTRAINT executives_current_company_id_fkey
  FOREIGN KEY (current_company_id) REFERENCES public.companies(id)
  ON DELETE SET NULL;

ALTER TABLE public.sectors
  ADD CONSTRAINT sectors_parent_sector_id_fkey
  FOREIGN KEY (parent_sector_id) REFERENCES public.sectors(id)
  ON DELETE SET NULL;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_primary_ticker_id_fkey
  FOREIGN KEY (primary_ticker_id) REFERENCES public.tickers(id)
  ON DELETE SET NULL;

-- updated_at bump trigger. Reused by every table that tracks updates.
-- SECURITY DEFINER not needed — it only touches NEW.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_tickers_updated_at
  BEFORE UPDATE ON public.tickers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_executives_updated_at
  BEFORE UPDATE ON public.executives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sectors_updated_at
  BEFORE UPDATE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- GIN indexes on array columns — used by the entity linker for fuzzy
-- resolution ("Alphabet" → companies.aliases @> '{Alphabet}') and by the
-- company/sector pages for reverse lookups.

CREATE INDEX idx_companies_aliases      ON public.companies  USING GIN (aliases);
CREATE INDEX idx_tickers_aliases        ON public.tickers    USING GIN (aliases);
CREATE INDEX idx_executives_aliases     ON public.executives USING GIN (aliases);
CREATE INDEX idx_sectors_aliases        ON public.sectors    USING GIN (aliases);
CREATE INDEX idx_companies_sector_ids   ON public.companies  USING GIN (sector_ids);
