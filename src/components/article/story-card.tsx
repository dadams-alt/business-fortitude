// src/components/article/story-card.tsx
// Generic 4:3 card for grids and the related strip. Mockup 02 L198–203.

import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/queries/articles";
import { Chip, categoryLabel, variantForCategory } from "@/components/ui/chip";
import { readMinutes } from "@/lib/format";

export function StoryCard({ article }: { article: Article }) {
  return (
    <article className="card">
      <Link href={`/article/${article.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-surface mb-3 relative">
          {article.hero_image_url && (
            <Image
              src={article.hero_image_url}
              alt={article.hero_image_alt ?? ""}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        <Chip variant={variantForCategory(article.category)}>
          {categoryLabel(article.category)}
        </Chip>
        <h3 className="font-bold text-[17px] leading-snug mt-2 title-link">
          {article.title}
        </h3>
        <div className="text-[12px] text-soft mt-1">
          {article.author_name ?? "Business Fortitude"} · {readMinutes(article.body_md)} min
        </div>
      </Link>
    </article>
  );
}
