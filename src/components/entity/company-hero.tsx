// src/components/entity/company-hero.tsx

import Link from "next/link";
import { EntityHero } from "./entity-hero";
import { AvatarPlaceholder } from "./avatar-placeholder";
import type { Company, Sector, Ticker } from "@/lib/queries/entities";

function safeHostname(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function CompanyHero({
  company,
  sectors,
  primaryTicker,
}: {
  company: Company;
  sectors: Sector[];
  primaryTicker: Ticker | null;
}) {
  const sublineParts: string[] = [];
  if (company.hq_country) sublineParts.push(company.hq_country);
  if (company.founded_year) sublineParts.push(`Founded ${company.founded_year}`);
  if (company.is_public) sublineParts.push("Public");
  const host = safeHostname(company.website_url);
  if (host) sublineParts.push(host);
  const subline = sublineParts.length > 0 ? sublineParts.join(" · ") : null;

  return (
    <>
      <EntityHero
        kicker="Company"
        headline={company.name}
        subline={subline}
        body={company.description}
        side={
          <AvatarPlaceholder
            name={company.name}
            slug={company.slug}
            size={120}
          />
        }
      />
      {(sectors.length > 0 || primaryTicker || company.website_url) && (
        <div className="flex flex-wrap items-center gap-2 -mt-6 mb-12">
          {primaryTicker && (
            <Link
              href={`/ticker/${primaryTicker.slug}`}
              className="ticker-inline"
            >
              {primaryTicker.exchange}:{primaryTicker.symbol}
            </Link>
          )}
          {sectors.map((s) => (
            <Link key={s.id} href={`/sector/${s.slug}`} className="entity-chip">
              <span className="dot" />
              {s.name}
            </Link>
          ))}
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="entity-chip"
            >
              <span className="dot" />
              Website
            </a>
          )}
        </div>
      )}
    </>
  );
}
