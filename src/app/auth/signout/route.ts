// src/app/auth/signout/route.ts
// Server-side sign-out. POST-only — admin layout's sign-out form
// submits here. Clears the Supabase session cookie and redirects
// home.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://business-fortitude.vercel.app",
  );
}
