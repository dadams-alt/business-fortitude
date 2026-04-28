// src/app/article/[slug]/page.tsx
// Article detail page. Server component. Layout lifted from
// mockups/article-01.html L121–303. ProgressBar is the only client
// component on this route.

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getArticleBySlug,
  getPublishedArticles,
  getRelatedArticles,
} from "@/lib/queries/articles";
import { Chip, categoryLabel } from "@/components/ui/chip";
import { ArticleMeta } from "@/components/article/article-meta";
import { ArticleBody } from "@/components/article/article-body";
import { AuthorCard } from "@/components/article/author-card";
import { DisclosureBox } from "@/components/article/disclosure-box";
import { ProgressBar } from "@/components/article/progress-bar";
import { StoryCard } from "@/components/article/story-card";
import { NewsletterCard } from "@/components/site/newsletter-card";
import { readMinutes } from "@/lib/format";
import { getAuthor } from "@/lib/data/authors";

const SITE_URL = "https://business-fortitude.vercel.app";

function buildArticleJsonLd(
  article: Awaited<ReturnType<typeof getArticleBySlug>>,
): Record<string, unknown> {
  if (!article) return {};
  const author = article.author_slug ? getAuthor(article.author_slug) : null;
  const authorObj = author
    ? {
        "@type": "Person",
        name: article.author_name ?? author.name,
        url: `${SITE_URL}/author/${author.slug}`,
      }
    : article.author_name
      ? { "@type": "Person", name: article.author_name }
      : undefined;

  const raw: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.lead ?? article.subtitle ?? undefined,
    image: article.hero_image_url ? [article.hero_image_url] : undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at,
    author: authorObj ? [authorObj] : undefined,
    publisher: {
      "@type": "Organization",
      name: "Business Fortitude",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/article/${article.slug}`,
    },
    articleSection: article.category,
  };
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined),
  );
}

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
  };
}

function splitTitle(title: string): { highlighted: string; rest: string } {
  const words = title.split(/\s+/);
  if (words.length <= 2) return { highlighted: title, rest: "" };
  // Try to highlight a 2–3 word phrase that doesn't end mid-clause.
  return {
    highlighted: words.slice(0, 2).join(" "),
    rest: " " + words.slice(2).join(" "),
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

  const [trending, related] = await Promise.all([
    getPublishedArticles({ limit: 4 }),
    getRelatedArticles(article.category, article.id, 3),
  ]);

  const minutes = readMinutes(article.body_md);
  const { highlighted, rest } = splitTitle(article.title);
  const author = article.author_slug ? getAuthor(article.author_slug) : null;
  const jsonLd = buildArticleJsonLd(article);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProgressBar />
      <main className="max-w-[1360px] mx-auto px-6">
        {/* Breadcrumb */}
        <div className="pt-6 text-[12px] font-mono text-soft uppercase tracking-widest">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <span className="mx-2 opacity-40">/</span>
          <a href="#" className="hover:text-accent">
            {categoryLabel(article.category)}
          </a>
          <span className="mx-2 opacity-40">/</span>
          <span className="opacity-60">Analysis</span>
        </div>

        {/* Article header */}
        <section className="pt-6 pb-8">
          <div className="max-w-[820px]">
            <div className="flex items-center gap-2 mb-5">
              <Chip variant="accent">{categoryLabel(article.category)}</Chip>
              <Chip variant="lime">Analysis</Chip>
              <Chip>{minutes} min read</Chip>
            </div>
            <h1 className="display text-[46px] md:text-[72px]">
              <span className="lime-underline">{highlighted}</span>
              {rest}
            </h1>
            {article.lead && (
              <p className="text-[20px] md:text-[22px] leading-[1.5] text-soft mt-6 font-medium">
                {article.lead}
              </p>
            )}
            <ArticleMeta article={article} />
          </div>
        </section>

        {/* Hero image */}
        {article.hero_image_url && (
          <figure className="pb-8">
            <div className="relative aspect-[16/8] overflow-hidden rounded-3xl bg-surface">
              <Image
                src={article.hero_image_url}
                alt={article.hero_image_alt ?? ""}
                fill
                priority
                sizes="(min-width: 1024px) 1360px, 100vw"
                className="object-cover"
              />
              {article.hero_image_credit && (
                <div className="absolute top-5 left-5 flex gap-2">
                  <span className="chip bg-white/90">
                    {article.hero_image_credit}
                  </span>
                </div>
              )}
            </div>
            {article.subtitle && (
              <figcaption className="text-[12px] text-soft mt-3 italic">
                {article.subtitle}
              </figcaption>
            )}
          </figure>
        )}

        {/* Body + rail */}
        <div className="pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <article className="lg:col-span-8">
            <ArticleBody markdown={article.body_md} />
            <DisclosureBox />
          </article>

          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-surface rounded-2xl p-5">
              <div className="kicker text-soft mb-4">Trending now</div>
              <ol className="space-y-4 divide-y divide-rule">
                {trending.map((t, i) => (
                  <li key={t.id} className={`flex gap-3 ${i === 0 ? "pt-0" : "pt-4"}`}>
                    <span className="display text-[22px] text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Link
                      href={`/article/${t.slug}`}
                      className="font-bold text-[15px] leading-snug hover:text-accent"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <NewsletterCard />
          </aside>
        </div>

        {/* Author card — links to /author/[slug] when the slug resolves to a known author */}
        {author && (
          <section className="py-12 border-t border-rule">
            <AuthorCard author={author} />
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="py-10 border-t border-rule">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="kicker text-soft mb-2">Keep reading</div>
                <h2 className="display text-[32px]">
                  More from {categoryLabel(article.category)}
                </h2>
              </div>
              <a
                href="#"
                className="arrow-link inline-flex items-center gap-2 text-[14px] font-semibold"
              >
                All {categoryLabel(article.category).toLowerCase()}{" "}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((article) => (
                <StoryCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
