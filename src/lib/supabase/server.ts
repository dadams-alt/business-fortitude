// src/lib/supabase/server.ts
// Anon-key Supabase client for server components. Reads the session from
// the request cookies via @supabase/ssr's getAll/setAll cookie API
// (introduced mid-2024). Cookie writes during a server component render
// are caught — Next.js disallows them outside route handlers / server
// actions, but the SDK's refresh path still tries to write.
//
// Note: createClient is async because Next.js 16's `cookies()` returns
// a Promise. Call sites must `await` it.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Diagnostic: which one is missing? Lengths only, never values.
    throw new Error(
      `Supabase env missing. NEXT_PUBLIC_SUPABASE_URL len=${url?.length ?? 0}, ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY len=${key?.length ?? 0}`,
    );
  }
  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server component render path — writes not permitted. Safe to
            // ignore; the next request will refresh the session anyway.
          }
        },
      },
    },
  );
}
