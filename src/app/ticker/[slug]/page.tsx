// src/app/ticker/[slug]/page.tsx
// Ticker page is intentionally price-free for v1 — stock_cache is
// unwired, and faking a price would mislead readers.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTickerBySlug,
  getArticlesForEntity,
  listTickers,
} from "@/lib/queries/entities";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Company } from "@/lib/queries/entities";
import { TickerHero } from "@/components/entity/ticker-hero";
import { StoryCard } from "@/components/article/story-card";

export const revalidate = 600;

export async function generateStaticParams() {
  const tickers = await listTickers();
  return tickers.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTickerBySlug(slug);
  if (!t) return {};
  return {
    title: `${t.exchange}:${t.symbol} — Business Fortitude`,
    description: `${t.name}. ${t.exchange} listing tracked on Business Fortitude.`,
  };
}

async function loadCompanyById(id: string | null): Promise<Company | null> {
  if (!id) return null;
  const { data } = await createAnonClient()
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export default async function TickerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ticker = await getTickerBySlug(slug);
  if (!ticker) notFound();

  const [company, articles] = await Promise.all([
    loadCompanyById(ticker.company_id),
    getArticlesForEntity("ticker", ticker.id, { limit: 20 }),
  ]);

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <TickerHero ticker={ticker} company={company} />

      <section>
        <h2 className="display text-[28px] mb-6">Articles</h2>
        {articles.length === 0 ? (
          <p className="text-soft text-[15px] py-6">
            No articles yet mention {ticker.exchange}:{ticker.symbol}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a) => (
              <StoryCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
