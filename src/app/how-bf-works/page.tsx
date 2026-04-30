// src/app/how-bf-works/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How BF Works — Business Fortitude",
  description:
    "How the Business Fortitude editorial pipeline ingests, filters, writes, illustrates, and publishes UK business news.",
};

export const revalidate = 86400;

export default function HowBFWorksPage() {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-12">
      <p className="kicker text-soft mb-3">How BF Works</p>
      <h1 className="display text-[44px] md:text-[64px] mb-8">
        The pipeline, explained.
      </h1>
      <div className="article-body">
        <p>
          Business Fortitude publishes through an automated editorial
          pipeline. Stories move from RSS ingest to a published article on
          the live site without a human touching the keyboard, but every
          stage runs against editorial standards a human would recognise.
          This page lays out the stack in full, because readers should know
          exactly what they are reading.
        </p>

        <h2>The five stages</h2>
        <p>
          <strong>1. Ingest.</strong> Every hour, BF pulls 22 UK business
          RSS feeds across general, scale-up, regional, sector, funding,
          and regulation categories. Items are deduplicated against the
          last 72 hours, normalised, and queued as candidates. The
          ingestion service identifies itself as{" "}
          <code>BusinessFortitudeBot</code> and respects per-feed polling
          intervals.
        </p>
        <p>
          <strong>2. Filter.</strong> A Claude Sonnet 4.6 model runs every
          candidate through an editorial rubric: is there a named UK
          entity, is the source primary or repackaged, has the same story
          already been covered. Decisions are approve, reject, or
          duplicate. A typical filter run approves around 60 per cent of
          candidates and rejects the rest with a stated reason.
        </p>
        <p>
          <strong>3. Write.</strong> Approved candidates are claimed by the
          writing service, which runs a two-pass Claude Opus 4.6 draft: an
          editorial brief setting the angle and target word count, then
          the full article. House voice is informed, neutral, British
          English. Banned phrases (em-dashes, hype adjectives, marketing
          register, investment advice) are sweep-checked by regex before
          the draft is accepted.
        </p>
        <p>
          <strong>4. Image.</strong> A Haiku 4.5 model writes a hero-image
          prompt against per-category visual directions. Gemini 3 Pro
          generates a 1200×630 hero image. Hard rules: no real people&rsquo;s
          faces, no real company logos, no currency symbols on charts.
          When Gemini fails twice, the pipeline falls back to a vector
          placeholder so a missing hero never blocks publication.
        </p>
        <p>
          <strong>5. Publish.</strong> Drafts with a hero image flip to
          published, the article is registered with IndexNow for instant
          search-engine indexing, and the homepage and article pages are
          revalidated on Vercel so the new content appears immediately.
        </p>

        <h2>Editorial standards</h2>
        <p>
          BF does not publish buy/sell/hold recommendations on any
          security. Quoted forecasts must carry attribution and date. We
          do not fabricate quotes; quotes appear in articles only when
          they are present verbatim in the source material. Articles
          mentioning a UK-listed public company carry the ticker on first
          mention. Every article ends with the standard FCA disclosure.
        </p>
        <p>
          The compliance layer is non-negotiable. If an article fails the
          regex sweep, it is reverted to the queue and the next run
          retries — we would rather miss a publication slot than ship
          tainted copy.
        </p>

        <h2>The entity directory</h2>
        <p>
          BF maintains a directory of 90 companies, 64 named individuals,
          26 listed tickers, and 22 sectors. Articles are tagged against
          this directory at publish time so readers can move from any
          story to the broader context — every article another mention of
          the same company has had, every other piece on the same sector,
          and so on. The directory is curated, not crowdsourced.
        </p>

        <h2>What this means for you</h2>
        <p>
          The pipeline is faster than a human desk and produces stories
          with a consistency a human desk would struggle to maintain. It
          is also more limited: it cannot break a story, it cannot
          interview a source, it cannot judge what a deal smells like. BF
          is built around what the pipeline does well — synthesis,
          context, the operator-relevant angle on news that has already
          surfaced — and is honest about what it does not.
        </p>
        <p>
          If we get something wrong, we want to hear about it.
          Corrections to{" "}
          <a href="mailto:editorial@businessfortitude.com">
            editorial@businessfortitude.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
