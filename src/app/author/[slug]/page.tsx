// src/app/author/[slug]/page.tsx
// Author profile + their published articles. Returns 404 for unknown
// slugs (forces the author-data file to stay in sync with what the
// pipeline writes into articles.author_slug).

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuthor, AUTHORS } from "@/lib/data/authors";
import { getArticlesByAuthor } from "@/lib/queries/articles";
import { AuthorCard } from "@/components/article/author-card";
import { StoryCard } from "@/components/article/story-card";

export const revalidate = 600;

export async function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) return {};
  return {
    title: `${author.name} — Business Fortitude`,
    description: author.bio,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();
  const articles = await getArticlesByAuthor(slug, { limit: 30 });
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <AuthorCard author={author} expanded linkToProfile={false} />
      {articles.length === 0 ? (
        <p className="text-soft py-12 mt-8 text-[15px]">
          No articles yet by this author.
        </p>
      ) : (
        <>
          <h2 className="display text-[28px] mt-12 mb-6">Recent articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a) => (
              <StoryCard key={a.id} article={a} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
