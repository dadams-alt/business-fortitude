// src/app/cookies/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies — Business Fortitude",
  description: "Cookies used on the Business Fortitude website.",
};

export const revalidate = 86400;

export default function CookiesPage() {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-12">
      <p className="kicker text-soft mb-3">Cookies</p>
      <h1 className="display text-[44px] md:text-[56px] mb-4">Cookies</h1>
      <p className="text-soft text-[14px] mb-8">
        Last updated: 30 April 2026.
      </p>
      <div className="article-body">
        <p>
          Business Fortitude uses functional cookies only. We do not use
          tracking cookies, third-party advertising cookies, or analytics
          cookies. We do not deploy fingerprinting, session-replay, or
          retargeting tools.
        </p>

        <h2>What is set</h2>
        <p>
          Our hosting platform (Vercel) may set a small number of
          first-party cookies for performance and security purposes:
          load-balancing identifiers, request-tracing tokens, and
          deployment-routing metadata. These are functional cookies
          with short lifetimes and are not used to identify or profile
          you.
        </p>
        <p>
          We do not currently set any cookies of our own. If we add a
          login flow or a reader-preferences feature in the future, the
          functional cookies needed will be listed here.
        </p>

        <h2>Newsletter</h2>
        <p>
          Subscribing to the newsletter does not set any tracking
          cookies. Your email address is stored on our server side; the
          form itself uses no client-side state beyond the page session.
        </p>

        <h2>How to disable</h2>
        <p>
          You can clear or block cookies from your browser settings.
          Browser-level settings vary; the documentation for{" "}
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chrome
          </a>
          ,{" "}
          <a
            href="https://support.mozilla.org/kb/clear-cookies-and-site-data-firefox"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firefox
          </a>
          , and{" "}
          <a
            href="https://support.apple.com/guide/safari/manage-cookies-sfri11471"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari
          </a>{" "}
          covers the common cases. Disabling all cookies will not break
          the reading experience on Business Fortitude.
        </p>
      </div>
    </main>
  );
}
