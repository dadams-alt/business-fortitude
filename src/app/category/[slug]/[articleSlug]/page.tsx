// src/app/category/[slug]/[articleSlug]/page.tsx
// Legacy URL preservation. The Lovable archive used
// /category/<cat-slug>/<article-slug> as the canonical article URL;
// after the new stack adopted /article/<slug> as canonical, those
// indexed Lovable URLs would otherwise 404.
//
// This route renders the same <ArticleView /> as /article/[slug] but
// emits a <link rel="canonical"> back to /article/[slug] via the
// generateMetadata alternates.canonical entry, telling search engines
// the canonical version is the new pattern. The category slug in the
// URL is validated against the article's stored category to guard
// against URL spoofing — mismatch returns 404.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug } from "@/lib/queries/articles";
import { ArticleView } from "@/components/article/article-view";
import { isValidCategory } from "@/lib/data/categories";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://business-fortitude.vercel.app";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>;
}): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  if (!isValidCategory(slug)) return { title: "Not found" };
  const article = await getArticleBySlug(articleSlug);
  if (!article || article.category !== slug) return { title: "Not found" };
  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.lead ?? undefined,
    alternates: {
      canonical: `${SITE_URL}/article/${article.slug}`,
    },
  };
}

export default async function LegacyArticlePage({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>;
}) {
  const { slug, articleSlug } = await params;
  if (!isValidCategory(slug)) notFound();
  const article = await getArticleBySlug(articleSlug);
  if (!article) notFound();
  if (article.category !== slug) notFound();
  return <ArticleView article={article} />;
}
