// src/components/entity/entity-hero.tsx
// Shared hero scaffold for company / ticker / person / sector pages.
// Each entity-type wrapper composes this with its own kicker, subline,
// and optional side visual.
//
// Body is rendered as Markdown so company descriptions and executive
// bios from entity-enrich (multi-paragraph, with **bold** emphasis)
// land correctly. Plain-text bodies (sectors, the bare 1-sentence
// fallback) render fine through the same path — react-markdown is a
// no-op on text without markdown syntax.

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

export function EntityHero({
  kicker,
  headline,
  subline,
  body,
  side,
  headlineClassName,
}: {
  kicker: string;
  headline: ReactNode;
  subline?: ReactNode;
  body?: string | null;
  side?: ReactNode;
  /** Override default display class — used by ticker hero for the mono symbol look. */
  headlineClassName?: string;
}) {
  return (
    <section className="border-b border-rule pb-10 mb-12">
      <p className="kicker text-soft mb-4">{kicker}</p>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-9">
          <h1
            className={
              headlineClassName ?? "display text-[44px] md:text-[64px] mb-3"
            }
          >
            {headline}
          </h1>
          {subline && (
            <p className="text-[14px] font-mono text-soft mb-5">{subline}</p>
          )}
          {body && (
            <div className="article-body max-w-3xl entity-body">
              <ReactMarkdown>{body}</ReactMarkdown>
            </div>
          )}
        </div>
        {side && <div className="lg:col-span-3 flex lg:justify-end">{side}</div>}
      </div>
    </section>
  );
}
