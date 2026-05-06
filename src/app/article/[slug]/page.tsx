// src/app/article/[slug]/page.tsx
// Canonical article URL. The legacy /category/[slug]/[articleSlug]
// route renders the same view via <ArticleView /> and adds a canonical
// alternate pointing here.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug } from "@/lib/queries/articles";
import { ArticleView } from "@/components/article/article-view";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://business-fortitude.vercel.app";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not found" };
  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.lead ?? undefined,
    alternates: {
      canonical: `${SITE_URL}/article/${article.slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  return <ArticleView article={article} />;
}
