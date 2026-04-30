// src/app/api/subscribe/route.ts
// Public newsletter signup endpoint. Server-side anon-key Supabase
// client (RLS allows anon INSERT only). Pretends-success on duplicate
// email so the response can't be used to enumerate subscribers.

import { NextResponse, type NextRequest } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";

const VALID_SOURCES = new Set(["homepage", "article-rail", "footer", "website"]);

interface SubscribeBody {
  email?: string;
  source?: string;
}

export async function POST(req: NextRequest) {
  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (
    !email ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    email.length > 254
  ) {
    return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
  }
  const source = VALID_SOURCES.has(body.source ?? "")
    ? (body.source as string)
    : "website";

  const supabase = createAnonClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    source,
    user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  // 23505 = unique_violation. Treat as success so the response can't
  // confirm whether an email is already subscribed.
  if (error && (error as unknown as { code?: string }).code !== "23505") {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
