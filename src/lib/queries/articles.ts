// src/lib/queries/articles.ts
// Server-side data access for articles. RLS lets anon SELECT only rows
// where status='published', so these queries are safe to run with the
// anon key — see migration 006_rls.sql.

import { createClient } from "@/lib/supabase/server";
import type { Database } from "./database.types";

export type Article = Database["public"]["Tables"]["articles"]["Row"];

export async function getPublishedArticles(opts?: {
  limit?: number;
  category?: string;
}): Promise<Article[]> {
  const supabase = await createClient();
  let q = supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function getRelatedArticles(
  category: string,
  excludeId: string,
  limit = 3,
): Promise<Article[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getArticlesByAuthor(
  authorSlug: string,
  opts?: { limit?: number },
): Promise<Article[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("author_slug", authorSlug)
    .order("published_at", { ascending: false })
    .limit(opts?.limit ?? 30);
  return data ?? [];
}

// Title-only search for v1. Body/lead search is a follow-up — needs a
// tsvector column for safe wildcard handling and ranking. ILIKE wildcard
// chars in user input are escaped so the query string can't be coerced
// into a pattern.
export async function searchArticles(
  query: string,
  opts?: { limit?: number },
): Promise<Article[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const pattern = `%${query.replace(/[%_\\]/g, "\\$&")}%`;
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .ilike("title", pattern)
    .order("published_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  return data ?? [];
}
