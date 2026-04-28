// src/components/article/author-card.tsx
// Author block used on the article page (compact, links to /author/[slug])
// and the author page itself (expanded, no link). Uses the bio + role
// from the AUTHORS data file rather than the article's category-derived
// fallback, so /author/[slug] is the source of truth.

import Image from "next/image";
import Link from "next/link";
import type { Author } from "@/lib/data/authors";

export function AuthorCard({
  author,
  expanded = false,
  linkToProfile = true,
}: {
  author: Author;
  expanded?: boolean;
  linkToProfile?: boolean;
}) {
  const photoSize = expanded ? "w-32 h-32" : "w-24 h-24";
  const nameSize = expanded ? "text-[40px]" : "text-[28px]";

  const inner = (
    <div className="bg-surface rounded-3xl p-8 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      <div className="md:col-span-2">
        <Image
          src={author.photoUrl}
          alt={author.name}
          width={240}
          height={240}
          className={`${photoSize} rounded-full object-cover`}
          unoptimized
        />
      </div>
      <div className={expanded ? "md:col-span-10" : "md:col-span-8"}>
        <p className="kicker text-soft mb-2">About the author</p>
        <h2 className={`display ${nameSize} mb-1`}>{author.name}</h2>
        <p className="text-[13px] text-soft mb-3">{author.role}</p>
        <p className="text-[15px] leading-[1.6]">{author.bio}</p>
      </div>
      {!expanded && (
        <div className="md:col-span-2 flex md:justify-end">
          <span className="btn-primary text-[13px]">All articles →</span>
        </div>
      )}
    </div>
  );

  if (!linkToProfile) return inner;
  return (
    <Link href={`/author/${author.slug}`} className="block">
      {inner}
    </Link>
  );
}
