// src/components/entity/entity-chips.tsx
// Renders the article_entities row set as a strip of chips above the
// article body. Tickers come first (most distinctive), then companies,
// people, sectors. Returns null if the article has no tags so the
// strip simply doesn't appear.

import Link from "next/link";
import type { ArticleEntities } from "@/lib/queries/entities";

export function EntityChips({ entities }: { entities: ArticleEntities }) {
  const total =
    entities.companies.length +
    entities.tickers.length +
    entities.executives.length +
    entities.sectors.length;
  if (total === 0) return null;
  return (
    <div className="border-y border-rule py-6 mb-10 max-w-[820px]">
      <p className="kicker text-soft mb-3">In this story</p>
      <div className="flex flex-wrap gap-2">
        {entities.tickers.map((t) => (
          <Link
            key={t.id}
            href={`/ticker/${t.slug}`}
            className="ticker-inline"
          >
            {t.exchange}:{t.symbol}
          </Link>
        ))}
        {entities.companies.map((c) => (
          <Link key={c.id} href={`/company/${c.slug}`} className="entity-chip">
            <span className="dot" />
            {c.name}
          </Link>
        ))}
        {entities.executives.map((e) => (
          <Link key={e.id} href={`/person/${e.slug}`} className="entity-chip">
            <span className="dot" />
            {e.name}
          </Link>
        ))}
        {entities.sectors.map((s) => (
          <Link key={s.id} href={`/sector/${s.slug}`} className="entity-chip">
            <span className="dot" />
            {s.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
