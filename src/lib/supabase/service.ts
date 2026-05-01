// src/lib/supabase/service.ts
// Service-role Supabase client for server-side routes that need to
// bypass RLS. Used by /api/unsubscribe (which UPDATEs a row anon
// can't touch) and any future admin-side server actions.
//
// Cookie-free, like the anon client. Distinct file because the env
// var (SERVICE_ROLE_KEY vs ANON_KEY) and the security implications
// (bypasses RLS) are different — keep the surface narrow.

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/queries/database.types";

let cached: SupabaseClient<Database> | null = null;

export function createServiceClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
