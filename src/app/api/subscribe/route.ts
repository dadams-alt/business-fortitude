// src/app/api/subscribe/route.ts
// Public newsletter signup endpoint.
//
// Pattern: service-role INSERT (bypasses RLS so we can SELECT the
// newly-created row's unsubscribe_token in the same flow), pretends-
// success on 23505 so the response can't be used to enumerate
// existing subscribers, fire-and-forget welcome email via Resend
// for new signups only.

import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { welcomeEmailTemplate } from "@/lib/email/templates";

const VALID_SOURCES = new Set(["homepage", "article-rail", "footer", "website"]);
const SITE_URL = "https://business-fortitude.vercel.app";
// Resend test-mode sender. Switch to a custom-domain address (e.g.
// hello@businessfortitude.com) once the domain is verified in Resend.
const FROM = "Business Fortitude <onboarding@resend.dev>";

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

  const supabase = createServiceClient();
  const { data: insertData, error } = await supabase
    .from("newsletter_subscribers")
    .insert({
      email,
      source,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    })
    .select("unsubscribe_token")
    .maybeSingle();

  // 23505 = unique_violation. Treat as success so the response can't
  // confirm whether an email is already subscribed. We deliberately
  // skip the welcome-email send on this path — re-subscribers don't
  // get re-greeted.
  if (error && (error as unknown as { code?: string }).code !== "23505") {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  // Fire-and-forget welcome email for new signups only. Errors are
  // logged but don't propagate to the caller — the subscription
  // itself succeeded, which is what they asked for.
  if (!error && insertData?.unsubscribe_token && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const tpl = welcomeEmailTemplate({
      email,
      unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=${insertData.unsubscribe_token}`,
    });
    resend.emails
      .send({
        from: FROM,
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      })
      .catch((err: unknown) => {
        console.error("welcome email send failed:", err);
      });
  }

  return NextResponse.json({ ok: true });
}
