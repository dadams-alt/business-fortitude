// src/app/sitemap.ts
// Standard XML sitemap. Includes the homepage, /search, every category,
// every author, and every published article. Capped at 5000 articles
// to stay under Google's 50K-URL-per-sitemap limit; we'll need to split
// into a sitemap index when we cross that.

import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/data/categories";
import { AUTHORS } from "@/lib/data/authors";
import {
  listCompanies,
  listExecutives,
  listSectors,
  listTickers,
} from "@/lib/queries/entities";

const BASE_URL = "https://business-fortitude.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: articles }, companies, executives, tickers, sectors] =
    await Promise.all([
      supabase
        .from("articles")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5000),
      listCompanies(),
      listExecutives(),
      listTickers(),
      listSectors(),
    ]);

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, priority: 1.0, changeFrequency: "hourly" },
    { url: `${BASE_URL}/search`, lastModified: now, priority: 0.4, changeFrequency: "monthly" },
    { url: `${BASE_URL}/about`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE_URL}/how-bf-works`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE_URL}/privacy`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/terms`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/cookies`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
  ];
  const categoryEntries: MetadataRoute.Sitemap = Object.keys(CATEGORIES).map(
    (slug) => ({
      url: `${BASE_URL}/category/${slug}`,
      lastModified: now,
      priority: 0.8,
      changeFrequency: "hourly",
    }),
  );
  const authorEntries: MetadataRoute.Sitemap = Object.keys(AUTHORS).map(
    (slug) => ({
      url: `${BASE_URL}/author/${slug}`,
      lastModified: now,
      priority: 0.5,
      changeFrequency: "daily",
    }),
  );
  const indexEntries: MetadataRoute.Sitemap = [
    "companies",
    "people",
    "sectors",
    "tickers",
  ].map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: now,
    priority: 0.5,
    changeFrequency: "daily" as const,
  }));
  const companyEntries: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${BASE_URL}/company/${c.slug}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "weekly",
  }));
  const personEntries: MetadataRoute.Sitemap = executives.map((e) => ({
    url: `${BASE_URL}/person/${e.slug}`,
    lastModified: now,
    priority: 0.5,
    changeFrequency: "weekly",
  }));
  const tickerEntries: MetadataRoute.Sitemap = tickers.map((t) => ({
    url: `${BASE_URL}/ticker/${t.slug}`,
    lastModified: now,
    priority: 0.5,
    changeFrequency: "weekly",
  }));
  const sectorEntries: MetadataRoute.Sitemap = sectors.map((s) => ({
    url: `${BASE_URL}/sector/${s.slug}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "weekly",
  }));
  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${BASE_URL}/article/${a.slug}`,
    lastModified: new Date(a.updated_at),
    priority: 0.7,
    changeFrequency: "weekly",
  }));
  return [
    ...staticEntries,
    ...categoryEntries,
    ...authorEntries,
    ...indexEntries,
    ...companyEntries,
    ...personEntries,
    ...tickerEntries,
    ...sectorEntries,
    ...articleEntries,
  ];
}
