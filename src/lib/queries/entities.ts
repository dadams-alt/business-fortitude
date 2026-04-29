// src/lib/queries/entities.ts
// Server-side data access for the entity directory. Anon key + RLS:
// the four entity tables are public-read (migration 006), and
// article_entities itself is public-read (with the noted caveat that
// it doesn't filter by parent article status — we apply a status check
// in JS where it matters).

// Use the cookie-free anon client throughout. All entity queries are
// public-read under RLS (migration 006); none of them needs a session.
// Critically, this lets generateStaticParams call list*() during the
// build, when cookies() isn't available.
import { createAnonClient } from "@/lib/supabase/anon";
import type { Database } from "./database.types";

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Ticker = Database["public"]["Tables"]["tickers"]["Row"];
export type Executive = Database["public"]["Tables"]["executives"]["Row"];
export type Sector = Database["public"]["Tables"]["sectors"]["Row"];
export type Article = Database["public"]["Tables"]["articles"]["Row"];

// === detail lookups ===

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const s = createAnonClient();
  const { data } = await s.from("companies").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getTickerBySlug(slug: string): Promise<Ticker | null> {
  const s = createAnonClient();
  const { data } = await s.from("tickers").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getExecutiveBySlug(slug: string): Promise<Executive | null> {
  const s = createAnonClient();
  const { data } = await s.from("executives").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getSectorBySlug(slug: string): Promise<Sector | null> {
  const s = createAnonClient();
  const { data } = await s.from("sectors").select("*").eq("slug", slug).maybeSingle();
  return data;
}

// === relationship lookups ===

export async function getCompanySectors(sectorIds: string[]): Promise<Sector[]> {
  if (sectorIds.length === 0) return [];
  const s = createAnonClient();
  const { data } = await s.from("sectors").select("*").in("id", sectorIds).order("name");
  return data ?? [];
}

export async function getCompanyTickers(companyId: string): Promise<Ticker[]> {
  const s = createAnonClient();
  const { data } = await s
    .from("tickers")
    .select("*")
    .eq("company_id", companyId)
    .order("exchange");
  return data ?? [];
}

export async function getCompanyExecutives(companyId: string): Promise<Executive[]> {
  const s = createAnonClient();
  const { data } = await s
    .from("executives")
    .select("*")
    .eq("current_company_id", companyId)
    .order("name");
  return data ?? [];
}

export async function getSectorCompanies(
  sectorId: string,
  opts?: { limit?: number },
): Promise<Company[]> {
  const s = createAnonClient();
  const { data } = await s
    .from("companies")
    .select("*")
    .contains("sector_ids", [sectorId])
    .order("name")
    .limit(opts?.limit ?? 60);
  return data ?? [];
}

// === articles for an entity ===
// article_entities is polymorphic — single helper, scoped by type.
// Joined article rows come back nested; we flatten and filter to
// status='published' since article_entities itself doesn't gate by
// publish state (see RLS note in 006).

export async function getArticlesForEntity(
  entityType: "company" | "ticker" | "executive" | "sector",
  entityId: string,
  opts?: { limit?: number },
): Promise<Article[]> {
  const s = createAnonClient();
  const { data } = await s
    .from("article_entities")
    .select("articles(*)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .limit(opts?.limit ?? 20);
  const rows = (data ?? []) as unknown as Array<{ articles: Article | null }>;
  return rows
    .map((r) => r.articles)
    .filter((a): a is Article => a !== null && a.status === "published")
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

// === entity chips for an article ===

export interface ArticleEntities {
  companies: Company[];
  tickers: Ticker[];
  executives: Executive[];
  sectors: Sector[];
}

export async function getEntitiesForArticle(articleId: string): Promise<ArticleEntities> {
  const s = createAnonClient();
  const { data: links } = await s
    .from("article_entities")
    .select("entity_type, entity_id")
    .eq("article_id", articleId);

  const empty: ArticleEntities = { companies: [], tickers: [], executives: [], sectors: [] };
  if (!links || links.length === 0) return empty;

  const ids = {
    company: links.filter((l) => l.entity_type === "company").map((l) => l.entity_id),
    ticker: links.filter((l) => l.entity_type === "ticker").map((l) => l.entity_id),
    executive: links.filter((l) => l.entity_type === "executive").map((l) => l.entity_id),
    sector: links.filter((l) => l.entity_type === "sector").map((l) => l.entity_id),
  };

  const [companies, tickers, executives, sectors] = await Promise.all([
    ids.company.length
      ? s.from("companies").select("*").in("id", ids.company).order("name").then((r) => r.data ?? [])
      : Promise.resolve([] as Company[]),
    ids.ticker.length
      ? s.from("tickers").select("*").in("id", ids.ticker).order("exchange").then((r) => r.data ?? [])
      : Promise.resolve([] as Ticker[]),
    ids.executive.length
      ? s.from("executives").select("*").in("id", ids.executive).order("name").then((r) => r.data ?? [])
      : Promise.resolve([] as Executive[]),
    ids.sector.length
      ? s.from("sectors").select("*").in("id", ids.sector).order("name").then((r) => r.data ?? [])
      : Promise.resolve([] as Sector[]),
  ]);

  return { companies, tickers, executives, sectors };
}

// === index lookups ===

export async function listCompanies(): Promise<Company[]> {
  const s = createAnonClient();
  const { data } = await s.from("companies").select("*").order("name");
  return data ?? [];
}

export async function listExecutives(): Promise<Executive[]> {
  const s = createAnonClient();
  const { data } = await s.from("executives").select("*").order("name");
  return data ?? [];
}

export async function listTickers(): Promise<Ticker[]> {
  const s = createAnonClient();
  const { data } = await s
    .from("tickers")
    .select("*")
    .order("exchange")
    .order("symbol");
  return data ?? [];
}

export async function listSectors(): Promise<Sector[]> {
  const s = createAnonClient();
  const { data } = await s.from("sectors").select("*").order("name");
  return data ?? [];
}
