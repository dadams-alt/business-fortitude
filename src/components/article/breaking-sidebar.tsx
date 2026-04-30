// src/components/article/breaking-sidebar.tsx
// Right rail on the homepage. Up to 4 stories. Mockup 02 L99–151.

import Link from "next/link";
import type { Article } from "@/lib/queries/articles";
import { Chip, categoryLabel, variantForCategory } from "@/components/ui/chip";
import { NewsletterCard } from "@/components/site/newsletter-card";
import { formatPublishedAt, readMinutes } from "@/lib/format";

export function BreakingSidebar({ articles }: { articles: Article[] }) {
  return (
    <aside className="lg:col-span-4 space-y-5">
      <div className="bg-surface rounded-2xl p-5">
        <div className="kicker mb-4 text-soft">Breaking</div>
        <div className="space-y-4 divide-y divide-rule">
          {articles.map((article, i) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className={`block card ${i === 0 ? "pt-0" : "pt-4"}`}
            >
              <div className="flex gap-3 items-start">
                <Chip
                  variant={variantForCategory(article.category)}
                  className="shrink-0"
                >
                  {categoryLabel(article.category)}
                </Chip>
                <div>
                  <h3 className="font-bold text-[15px] leading-snug title-link">
                    {article.title}
                  </h3>
                  <div className="text-[12px] text-soft mt-1">
                    {formatPublishedAt(article.published_at)} · {readMinutes(article.body_md)} min
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <NewsletterCard source="homepage" />
    </aside>
  );
}
