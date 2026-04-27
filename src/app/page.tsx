// src/app/page.tsx
// Homepage. Server component. Reads articles via the anon-key Supabase
// client; RLS enforces status='published' visibility.

import { getPublishedArticles } from "@/lib/queries/articles";
import { HeroCard } from "@/components/article/hero-card";
import { BreakingSidebar } from "@/components/article/breaking-sidebar";
import { StoryCard } from "@/components/article/story-card";
import { FeaturedDecision } from "@/components/article/featured-decision";

export const revalidate = 60;

export default async function HomePage() {
  const articles = await getPublishedArticles({ limit: 14 });

  if (articles.length === 0) return <EmptyState />;

  const [hero, ...rest] = articles;
  const breaking = rest.slice(0, 4);
  const featured = articles.length >= 6 ? rest[4] : undefined;
  const latest = featured ? rest.slice(5) : rest.slice(4);

  return (
    <main className="max-w-[1360px] mx-auto px-6">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-10">
        <HeroCard article={hero} />
        <BreakingSidebar articles={breaking} />
      </section>

      {/* Decorative filter strip — chips are visual only. */}
      <section className="py-4 border-t border-rule">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 font-mono text-[12px] uppercase tracking-widest">
          <span className="text-soft shrink-0">Filter:</span>
          <span className="chip bg-ink text-white shrink-0">All</span>
          <span className="chip bg-surface shrink-0">Markets</span>
          <span className="chip bg-surface shrink-0">Deals</span>
          <span className="chip bg-surface shrink-0">Leadership</span>
          <span className="chip bg-surface shrink-0">AI</span>
          <span className="chip bg-surface shrink-0">Startups</span>
          <span className="chip bg-surface shrink-0">Regulation</span>
          <span className="chip bg-surface shrink-0">Opinion</span>
        </div>
      </section>

      {featured && <FeaturedDecision article={featured} />}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latest.map((article) => (
              <StoryCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-20">
      <div className="max-w-xl mx-auto text-center">
        <div className="kicker text-soft mb-4">No published articles yet</div>
        <h1 className="display text-[48px] mb-4">
          <span className="lime-underline">Coming soon.</span>
        </h1>
        <p className="text-soft text-[16px] leading-[1.6]">
          The Business Fortitude editorial pipeline is being seeded. Check back
          shortly for the first wave of stories.
        </p>
      </div>
    </main>
  );
}
