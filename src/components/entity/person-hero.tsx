// src/components/entity/person-hero.tsx

import Image from "next/image";
import Link from "next/link";
import { EntityHero } from "./entity-hero";
import { AvatarPlaceholder } from "./avatar-placeholder";
import type { Company, Executive } from "@/lib/queries/entities";

export function PersonHero({
  executive,
  company,
}: {
  executive: Executive;
  company: Company | null;
}) {
  const sublineParts: Array<string | null> = [];
  if (executive.role) sublineParts.push(executive.role);
  // Company link is rendered separately below the hero so the link can
  // be a real <Link>; we keep the subline plain text.
  if (company) sublineParts.push(company.name);
  const subline = sublineParts.filter(Boolean).join(" · ") || null;

  const side = executive.photo_url ? (
    <Image
      src={executive.photo_url}
      alt={executive.name}
      width={240}
      height={240}
      className="w-32 h-32 rounded-full object-cover"
      unoptimized
    />
  ) : (
    <AvatarPlaceholder name={executive.name} slug={executive.slug} size={120} />
  );

  return (
    <>
      <EntityHero
        kicker="Person"
        headline={executive.name}
        subline={subline}
        body={executive.bio}
        side={side}
      />
      {(company ||
        executive.linkedin_url ||
        executive.twitter_url) && (
        <div className="flex flex-wrap items-center gap-2 -mt-6 mb-12">
          {company && (
            <Link href={`/company/${company.slug}`} className="entity-chip">
              <span className="dot" />
              {company.name}
            </Link>
          )}
          {executive.linkedin_url && (
            <a
              href={executive.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="entity-chip"
            >
              <span className="dot" />
              LinkedIn
            </a>
          )}
          {executive.twitter_url && (
            <a
              href={executive.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="entity-chip"
            >
              <span className="dot" />
              X / Twitter
            </a>
          )}
        </div>
      )}
    </>
  );
}
