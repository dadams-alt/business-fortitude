// src/app/terms/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — Business Fortitude",
  description: "Terms of use for the Business Fortitude website.",
};

export const revalidate = 86400;

export default function TermsPage() {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-12">
      <p className="kicker text-soft mb-3">Terms</p>
      <h1 className="display text-[44px] md:text-[56px] mb-4">Terms of use</h1>
      <p className="text-soft text-[14px] mb-8">
        Last updated: 30 April 2026. These terms are currently in draft
        pending formal legal review.
      </p>
      <div className="article-body">
        <h2>What you read here</h2>
        <p>
          Business Fortitude publishes journalism about UK and global
          business. The articles you read on this site are intended as
          journalism. They are not investment advice, financial advice,
          tax advice, or legal advice. They do not establish a
          professional relationship between you and Business Fortitude.
          You are responsible for the decisions you make on the basis of
          what you read here.
        </p>
        <p>
          Every article that mentions a security carries an FCA-shaped
          disclosure. The disclosure exists because it is true: we are
          not authorised or regulated by the Financial Conduct Authority
          and the article is not investment advice. Read the disclosure
          and treat it as binding.
        </p>

        <h2>Use of content</h2>
        <p>
          Articles, headlines, photography, and code published on this
          site are the copyright of Business Fortitude unless otherwise
          stated. You may quote our work with clear attribution and a
          link back to the original article. You may not republish full
          articles, scrape the site at scale, train large language
          models on our work without permission, or pass our content
          off as your own.
        </p>
        <p>
          Reasonable RSS-feed consumption (up to four polls per hour
          per IP) is fine. If you want to do something more involved,
          write to us first.
        </p>

        <h2>Liability</h2>
        <p>
          We make a serious effort to be accurate. We do not guarantee
          accuracy, completeness, or fitness for any particular purpose.
          To the extent permitted by law, Business Fortitude is not
          liable for any loss or damage arising from your use of, or
          reliance on, anything published on this site.
        </p>

        <h2>Corrections</h2>
        <p>
          If you spot a factual error in a Business Fortitude article,
          write to{" "}
          <a href="mailto:editorial@businessfortitude.com">
            editorial@businessfortitude.com
          </a>
          . We correct factual errors and add a correction note to the
          article.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of England and Wales. Any
          dispute will be subject to the exclusive jurisdiction of the
          courts of England and Wales.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms as the publication evolves. The
          effective date at the top of the page indicates the version
          in force.
        </p>
      </div>
    </main>
  );
}
