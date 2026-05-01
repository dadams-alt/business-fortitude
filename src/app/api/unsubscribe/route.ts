// src/app/api/unsubscribe/route.ts
// GET-based unsubscribe (so the link can be embedded in email
// without JS / form interaction). Token is the 48-hex
// unsubscribe_token populated by migration 011's column default.
//
// Uses the service-role client because RLS allows anon INSERT only;
// UPDATE of unsubscribed_at requires service-role privileges.
//
// Idempotent — if the row is already unsubscribed (or the token is
// unknown) we return a friendly "already unsubscribed" page rather
// than error, so the link works even after the action completes.

import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const TOKEN_RE = /^[a-f0-9]{48}$/;

function htmlPage(headline: string, message: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe — Business Fortitude</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 60px 24px; color: #0a0a0a; line-height: 1.55; }
  h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 16px; }
  h1 span { color: #0055ff; }
  p { font-size: 16px; margin: 0 0 16px; }
  a { color: #0055ff; }
  hr { border: none; border-top: 1px solid #e7e5e4; margin: 32px 0; }
</style>
</head>
<body>
<h1>${headline}</h1>
<p>${message}</p>
<hr>
<p><a href="https://business-fortitude.vercel.app/">Back to Business <span>Fortitude</span></a></p>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !TOKEN_RE.test(token)) {
    return htmlPage(
      "Invalid unsubscribe link",
      "The link in your email could not be parsed. If you keep getting Business Fortitude email after trying again, write to privacy@businessfortitude.com.",
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .is("unsubscribed_at", null)
    .select("email")
    .maybeSingle();

  if (error) {
    return htmlPage(
      "Server error",
      "Something went wrong on our end. Please try the link again in a moment, or write to privacy@businessfortitude.com if it persists.",
    );
  }

  if (!data) {
    return htmlPage(
      "Already unsubscribed",
      "This email address is no longer on the Business Fortitude list. No further newsletters will be sent. If you think you're still receiving them, write to privacy@businessfortitude.com.",
    );
  }

  return htmlPage(
    "You've been unsubscribed",
    `${data.email} is no longer on the Business Fortitude list. No further newsletters will be sent. We're sorry to see you go.`,
  );
}
