"use client";

// src/lib/supabase/browser.ts
// Client-side Supabase client used by the magic-link login form. The
// browser client handles its own session cookie reads/writes — pair it
// with the SSR server.ts client in middleware/route handlers for
// session propagation.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
