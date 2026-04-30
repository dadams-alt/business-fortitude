// src/app/about/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Business Fortitude",
  description:
    "Business Fortitude is an independent UK business publication for entrepreneurs, scale-up operators, and senior professionals. Published in London.",
};

export const revalidate = 86400;

export default function AboutPage() {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-12">
      <p className="kicker text-soft mb-3">About</p>
      <h1 className="display text-[44px] md:text-[64px] mb-8">
        Built for UK operators.
      </h1>
      <div className="article-body">
        <p>
          Business Fortitude is an independent business publication for the
          people who run UK companies. Founders, COOs, finance directors,
          board members at SMEs and scale-ups. The reader BF has in mind is
          someone who already reads the FT and Reuters for breaking news and
          comes here for the operator-relevant angle, the editorial judgment,
          and the analysis a generalist desk would not bother with.
        </p>
        <p>
          The publication is independent. It is not owned by a legacy media
          group, a venture firm, or a bank. It is published in London. The
          editorial focus is UK-relevant business news — markets, deals,
          leadership, AI, startups, regulation, and opinion — with selective
          coverage of FTSE 100 names and the global technology companies
          whose decisions land on UK businesses.
        </p>
        <h2>What we cover</h2>
        <p>
          Seven editorial verticals. Each runs against the same rubric:
          named UK entities, hard numbers, and an angle that helps an
          operator do their job. We publish less than a typical wire service
          and pay more attention to what we publish. Stories that read as
          repackaged press releases get rejected at the filter stage.
        </p>
        <h2>How we work</h2>
        <p>
          BF is a working publication, evolving in public. We are explicit
          about how the editorial pipeline is built, what its constraints
          are, and where its limits sit. The{" "}
          <a href="/how-bf-works">How BF Works</a> page lays out the full
          stack — ingest, filter, write, image, publish — and the
          editorial standards each stage holds. If we get something wrong,
          we want to hear about it.
        </p>
        <h2>Contact</h2>
        <p>
          Editorial corrections, story tips, and reader feedback:{" "}
          <a href="mailto:editorial@businessfortitude.com">
            editorial@businessfortitude.com
          </a>
          . Treated as on-the-record unless you say otherwise.
        </p>
      </div>
    </main>
  );
}
