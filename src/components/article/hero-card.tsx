// src/components/article/hero-card.tsx
// Homepage hero. Lifted from mockups/02-modern-business-tech.html L79–97.
// First two words of the title get the .lime-underline highlight.

import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/queries/articles";
import { Chip, categoryLabel } from "@/components/ui/chip";
import { avatarUrl, formatPublishedAt, readMinutes } from "@/lib/format";

function splitTitle(title: string): { highlighted: string; rest: string } {
  const words = title.split(/\s+/);
  if (words.length <= 2) return { highlighted: title, rest: "" };
  return {
    highlighted: words.slice(0, 2).join(" "),
    rest: " " + words.slice(2).join(" "),
  };
}

export function HeroCard({ article }: { article: Article }) {
  const { highlighted, rest } = splitTitle(article.title);
  const min = readMinutes(article.body_md);
  return (
    <article className="lg:col-span-8 card">
      <Link href={`/article/${article.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface">
          {article.hero_image_url && (
            <Image
              src={article.hero_image_url}
              alt={article.hero_image_alt ?? ""}
              fill
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <Chip variant="lime">Top story</Chip>
            <Chip variant="outline">{categoryLabel(article.category)}</Chip>
          </div>
        </div>
        <div className="mt-5">
          <h1 className="display text-[44px] md:text-[56px]">
            <span className="title-link">
              <span className="lime-underline">{highlighted}</span>
              {rest}
            </span>
          </h1>
          {article.lead && (
            <p className="text-[18px] leading-[1.55] text-soft mt-4 max-w-3xl">
              {article.lead}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3 text-[13px] text-soft">
            <Image
              src={avatarUrl(article.author_slug, 64)}
              alt=""
              width={28}
              height={28}
              className="rounded-full"
              unoptimized
            />
            {article.author_name && (
              <span>
                <b className="text-ink">{article.author_name}</b>
              </span>
            )}
            <span>·</span>
            <span>{min} min read</span>
            {article.published_at && (
              <>
                <span>·</span>
                <span>{formatPublishedAt(article.published_at)}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
