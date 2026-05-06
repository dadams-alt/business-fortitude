// src/lib/email/templates.ts
// Pure helpers — return {subject, text, html}. The /api/subscribe
// route consumes welcomeEmailTemplate and hands the result to
// Resend. Keeping these as pure functions makes them trivially
// testable and reusable when we add more email types.

interface WelcomeArgs {
  email: string;
  unsubscribeUrl: string;
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.businessfortitude.com";
// Display label for the site link in HTML emails — derived from
// SITE_URL so the rendered text matches the destination on hover.
const SITE_LABEL = SITE_URL.replace(/^https?:\/\//, "");

export function welcomeEmailTemplate({
  unsubscribeUrl,
}: WelcomeArgs): EmailTemplate {
  const subject = "Welcome to Business Fortitude";
  const text = `Welcome to Business Fortitude.

You've subscribed to The Morning Brief — independent UK business news for operators, founders, and senior professionals. The first edition will arrive shortly. Until then, the latest stories are at ${SITE_URL}/.

Unsubscribe anytime: ${unsubscribeUrl}

— The Business Fortitude team
`;
  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0a0a0a">
  <h1 style="font-size:28px;font-weight:900;letter-spacing:-0.02em;margin:0 0 16px">Welcome to Business <span style="color:#0055ff">Fortitude</span>.</h1>
  <p style="font-size:16px;line-height:1.55;margin:0 0 16px">You've subscribed to <strong>The Morning Brief</strong> — independent UK business news for operators, founders, and senior professionals.</p>
  <p style="font-size:16px;line-height:1.55;margin:0 0 24px">The first edition will arrive shortly. Until then, the latest stories are at <a href="${SITE_URL}" style="color:#0055ff">${SITE_LABEL}</a>.</p>
  <hr style="border:none;border-top:1px solid #e7e5e4;margin:32px 0">
  <p style="font-size:12px;color:#4a4a4a;margin:0">Don't want these emails? <a href="${unsubscribeUrl}" style="color:#4a4a4a">Unsubscribe instantly</a>.</p>
</body></html>`;
  return { subject, text, html };
}
