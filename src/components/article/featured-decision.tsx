// src/components/article/featured-decision.tsx
// "The Decision" feature block. Mockup 02 L172–187.

import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/queries/articles";
import { Chip } from "@/components/ui/chip";
import { readMinutes } from "@/lib/format";

export function FeaturedDecision({ article }: { article: Article }) {
  const minutes = readMinutes(article.body_md);
  return (
    <section className="py-10 border-t border-rule">
      <div className="flex items-center gap-3 mb-6">
        <Chip variant="lime">Featured</Chip>
        <h2 className="display text-[30px]">The Decision</h2>
      </div>
      <article className="grid grid-cols-1 md:grid-cols-12 gap-8 card">
        <Link
          href={`/article/${article.slug}`}
          className="md:col-span-7 aspect-[16/10] overflow-hidden rounded-2xl bg-surface relative block"
        >
          {article.hero_image_url && (
            <Image
              src={article.hero_image_url}
              alt={article.hero_image_alt ?? ""}
              fill
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover"
            />
          )}
        </Link>
        <div className="md:col-span-5 flex flex-col justify-center">
          <div className="kicker text-soft mb-2">Long read · {minutes} min</div>
          <h3 className="display text-[36px] leading-[1.05]">
            <Link href={`/article/${article.slug}`} className="title-link">
              {article.title}
            </Link>
          </h3>
          {article.lead && (
            <p className="text-soft mt-4 text-[16px] leading-[1.6]">
              {article.lead}
            </p>
          )}
          <Link
            href={`/article/${article.slug}`}
            className="arrow-link inline-flex items-center gap-2 mt-5 font-semibold"
          >
            Read the story{" "}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </article>
    </section>
  );
}
