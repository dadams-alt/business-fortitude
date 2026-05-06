// src/app/page.tsx
// Homepage. Server component. Reads articles via the anon-key Supabase
// client; RLS enforces status='published' visibility.

import { getPublishedArticles } from "@/lib/queries/articles";
import { HeroCard } from "@/components/article/hero-card";
import { BreakingSidebar } from "@/components/article/breaking-sidebar";
import { FeaturedDecision } from "@/components/article/featured-decision";
import { LatestSection } from "@/components/article/latest-section";

export const revalidate = 60;

export default async function HomePage() {
  // Larger fetch so the Latest grid has enough material for the
  // category-filter chips to be useful, not just decorative.
  const articles = await getPublishedArticles({ limit: 40 });

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

      <LatestSection latest={latest}>
        {featured && <FeaturedDecision article={featured} />}
      </LatestSection>
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
