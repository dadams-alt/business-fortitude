// src/components/article/article-meta.tsx
// Byline strip on article detail. Mockup article-01.html L144–161.
// "Role" line is derived from category since we don't have an authors
// table yet.

import Image from "next/image";
import type { Article } from "@/lib/queries/articles";
import { avatarUrl, formatPublishedAt } from "@/lib/format";

const ROLES: Record<string, string> = {
  markets: "Markets editor · London",
  deals: "Deals desk · London",
  leadership: "Leadership editor · London",
  ai: "AI editor · London",
  startups: "Startups desk · London",
  regulation: "Regulation desk · London",
  opinion: "Columnist",
};

export function ArticleMeta({ article }: { article: Article }) {
  const role = ROLES[article.category] ?? "Business Fortitude";
  return (
    <div className="flex flex-wrap items-center gap-5 mt-8 pt-6 border-t border-rule">
      <div className="flex items-center gap-3">
        <Image
          src={avatarUrl(article.author_slug, 80)}
          alt=""
          width={44}
          height={44}
          className="rounded-full object-cover"
          unoptimized
        />
        <div>
          <div className="text-[14px] font-bold">
            {article.author_name ?? "Business Fortitude"}
          </div>
          <div className="text-[12px] text-soft">{role}</div>
        </div>
      </div>
      <div className="text-[12px] text-soft font-mono">
        {formatPublishedAt(article.published_at)}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <a href="#" className="share-btn" aria-label="Share on X">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a href="#" className="share-btn" aria-label="Share on LinkedIn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
        <a href="#" className="share-btn" aria-label="Save">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </a>
        <a href="#" className="share-btn" aria-label="Copy link">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.72" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.72" />
          </svg>
        </a>
      </div>
    </div>
  );
}
