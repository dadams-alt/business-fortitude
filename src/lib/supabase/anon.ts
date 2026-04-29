// src/lib/supabase/anon.ts
// Cookie-free Supabase client for places where there's no HTTP request:
// generateStaticParams, sitemap.ts, and any other build-time path. The
// SSR createClient in server.ts calls `cookies()`, which Next.js 16
// rejects outside a request context.
//
// Anon key + RLS: all public-read queries (articles WHERE published,
// the four entity tables, article_entities) work fine through this
// client. Don't use it for queries that need a logged-in session.

import { createClient as createBaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/queries/database.types";

let cached: SupabaseClient<Database> | null = null;

export function createAnonClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  cached = createBaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
