// src/components/entity/ticker-hero.tsx
// Headline is the symbol+exchange in mono. Subline is the parent
// company name as a link.

import Link from "next/link";
import { EntityHero } from "./entity-hero";
import type { Company, Ticker } from "@/lib/queries/entities";

export function TickerHero({
  ticker,
  company,
}: {
  ticker: Ticker;
  company: Company | null;
}) {
  const symbolDisplay = `${ticker.exchange}:${ticker.symbol}`;
  const sublineParts: string[] = [];
  if (ticker.name) sublineParts.push(ticker.name);
  if (ticker.currency) sublineParts.push(ticker.currency);
  const subline = sublineParts.join(" · ") || null;

  return (
    <>
      <EntityHero
        kicker="Ticker"
        headlineClassName="display text-[44px] md:text-[64px] mb-3 font-mono tracking-tight"
        headline={symbolDisplay}
        subline={subline}
        body={null}
      />
      {company && (
        <div className="flex flex-wrap items-center gap-2 -mt-6 mb-12">
          <Link href={`/company/${company.slug}`} className="entity-chip">
            <span className="dot" />
            {company.name}
          </Link>
        </div>
      )}
    </>
  );
}
