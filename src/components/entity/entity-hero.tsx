// src/components/entity/entity-hero.tsx
// Shared hero scaffold for company / ticker / person / sector pages.
// Each entity-type wrapper composes this with its own kicker, subline,
// and optional side visual.

import type { ReactNode } from "react";

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
            <p className="text-[18px] leading-[1.55] max-w-3xl">{body}</p>
          )}
        </div>
        {side && <div className="lg:col-span-3 flex lg:justify-end">{side}</div>}
      </div>
    </section>
  );
}
