// src/app/category/[slug]/page.tsx
// Category index. Renders a header strip + a grid of published articles
// in that category. Returns 404 for unknown slugs.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, isValidCategory } from "@/lib/data/categories";
import { getPublishedArticles } from "@/lib/queries/articles";
import { CategoryHeader } from "@/components/article/category-header";
import { StoryCard } from "@/components/article/story-card";

export const revalidate = 300;

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidCategory(slug)) return {};
  const cat = CATEGORIES[slug];
  return {
    title: `${cat.name} — Business Fortitude`,
    description: cat.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidCategory(slug)) notFound();
  const cat = CATEGORIES[slug];
  const articles = await getPublishedArticles({ category: slug, limit: 30 });
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <CategoryHeader name={cat.name} description={cat.description} />
      {articles.length === 0 ? (
        <p className="text-soft py-12 text-[15px]">
          No articles yet in this category. The autonomous pipeline is working
          on it.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {articles.map((a) => (
            <StoryCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </main>
  );
}
