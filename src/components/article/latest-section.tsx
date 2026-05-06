"use client";

// src/components/article/latest-section.tsx
// Holds the homepage filter chip strip and the Latest article grid as
// one client component so the chips drive a useState-backed filter on
// the grid. Wrapping the FeaturedDecision passed as children keeps the
// existing visual order: chip strip → FeaturedDecision → Latest grid.

import { useState, type ReactNode } from "react";
import type { Article } from "@/lib/queries/articles";
import { StoryCard } from "@/components/article/story-card";

const FILTERS: Array<{ label: string; value: string }> = [
  { label: "All", value: "all" },
  { label: "Markets", value: "markets" },
  { label: "Deals", value: "deals" },
  { label: "Leadership", value: "leadership" },
  { label: "AI", value: "ai" },
  { label: "Startups", value: "startups" },
  { label: "Regulation", value: "regulation" },
  { label: "Opinion", value: "opinion" },
];

export function LatestSection({
  latest,
  children,
}: {
  latest: Article[];
  children?: ReactNode;
}) {
  const [filter, setFilter] = useState<string>("all");
  const filtered =
    filter === "all" ? latest : latest.filter((a) => a.category === filter);

  return (
    <>
      <section className="py-4 border-t border-rule">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 font-mono text-[12px] uppercase tracking-widest">
          <span className="text-soft shrink-0">Filter:</span>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={active}
                className={
                  active
                    ? "chip bg-ink text-white shrink-0 cursor-pointer"
                    : "chip bg-surface shrink-0 cursor-pointer hover:bg-rule transition"
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {children}

      {latest.length > 0 && (
        <section className="py-10 border-t border-rule">
          <div className="flex items-end justify-between mb-6">
            <h2 className="display text-[32px]">Latest</h2>
            <a
              href="#"
              className="arrow-link inline-flex items-center gap-2 text-[14px] font-semibold"
            >
              All stories{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((article) => (
                <StoryCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-soft text-[15px] py-6">
              No recent stories in this category. Try another filter or visit
              the full category page.
            </p>
          )}
        </section>
      )}
    </>
  );
}
