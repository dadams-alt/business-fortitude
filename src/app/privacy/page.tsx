// src/app/privacy/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Business Fortitude",
  description:
    "How Business Fortitude collects, uses, and retains personal data. UK GDPR-shaped privacy notice.",
};

export const revalidate = 86400;

export default function PrivacyPage() {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-12">
      <p className="kicker text-soft mb-3">Privacy</p>
      <h1 className="display text-[44px] md:text-[56px] mb-4">Privacy notice</h1>
      <p className="text-soft text-[14px] mb-8">
        Last updated: 30 April 2026. This privacy notice is currently in
        draft pending formal legal review.
      </p>
      <div className="article-body">
        <h2>What we collect</h2>
        <p>
          <strong>Newsletter subscribers.</strong> When you submit your
          email through a Business Fortitude signup form, we store your
          email address, the page where you subscribed, the timestamp,
          and the user-agent string sent by your browser. We use this to
          send you the newsletter and to understand how readers find us.
        </p>
        <p>
          <strong>Server logs.</strong> Our hosting provider logs request
          metadata (IP address, request path, response status, timestamp)
          for security and operational purposes. These logs are retained
          for a short period and not used for analytics.
        </p>
        <p>
          <strong>Functional cookies.</strong> Session and preference
          cookies set by the application itself. We do not use tracking
          cookies and we do not deploy third-party advertising or
          analytics pixels.
        </p>

        <h2>What we do not collect</h2>
        <p>
          We do not run third-party analytics (no Google Analytics, no
          Plausible, no Fathom). We do not run third-party advertising
          networks. We do not sell or share subscriber data with third
          parties for marketing.
        </p>

        <h2>Legal basis</h2>
        <p>
          Newsletter subscriptions are processed on the basis of your
          consent (article 6(1)(a) UK GDPR). You can withdraw consent and
          unsubscribe at any time. Server log retention is processed on
          the basis of legitimate interests (article 6(1)(f) UK GDPR) for
          the purposes of security and service operation.
        </p>

        <h2>Retention</h2>
        <p>
          Newsletter subscriber records are retained while your
          subscription is active and for up to 12 months after
          unsubscription, after which they are deleted. Server logs are
          retained for up to 90 days.
        </p>

        <h2>Your rights</h2>
        <p>
          Under UK GDPR you have the right to access, rectify, or erase
          personal data we hold about you, to restrict or object to
          processing, and to data portability. To exercise any of these
          rights, write to{" "}
          <a href="mailto:privacy@businessfortitude.com">
            privacy@businessfortitude.com
          </a>{" "}
          and we will respond within one month.
        </p>
        <p>
          If you believe we have mishandled your data you have the right
          to complain to the Information Commissioner&rsquo;s Office at{" "}
          <a
            href="https://ico.org.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            ico.org.uk
          </a>
          .
        </p>

        <h2>Changes</h2>
        <p>
          We will update this notice as the publication evolves. Material
          changes will be communicated to active subscribers in the
          newsletter. The effective date at the top of the page indicates
          the version in force.
        </p>
      </div>
    </main>
  );
}
