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
