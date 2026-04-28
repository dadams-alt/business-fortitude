// src/app/search/page.tsx
// Title-only search. Reads ?q server-side, runs an ILIKE against
// articles.title, renders results as story cards. Force-dynamic
// because results depend on the query string.

import type { Metadata } from "next";
import { searchArticles } from "@/lib/queries/articles";
import { StoryCard } from "@/components/article/story-card";
import { SearchForm } from "@/components/article/search-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search — Business Fortitude",
  description: "Search Business Fortitude articles by title.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const articles = query ? await searchArticles(query, { limit: 50 }) : [];
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <h1 className="display text-[44px] md:text-[56px] mb-8">Search</h1>
      <SearchForm initialQuery={query} />
      {query && (
        <div className="mt-10">
          <p className="text-soft text-[14px] mb-6">
            {articles.length} result{articles.length === 1 ? "" : "s"} for
            &ldquo;{query}&rdquo;
          </p>
          {articles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((a) => (
                <StoryCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
