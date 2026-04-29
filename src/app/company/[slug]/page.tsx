// src/app/company/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCompanyBySlug,
  getCompanySectors,
  getCompanyTickers,
  getCompanyExecutives,
  getArticlesForEntity,
  listCompanies,
} from "@/lib/queries/entities";
import { CompanyHero } from "@/components/entity/company-hero";
import { StoryCard } from "@/components/article/story-card";

export const revalidate = 600;

export async function generateStaticParams() {
  const companies = await listCompanies();
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCompanyBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.name} — Business Fortitude`,
    description:
      c.meta_description ??
      c.description ??
      `${c.name} on Business Fortitude.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [sectors, tickers, executives, articles] = await Promise.all([
    getCompanySectors(company.sector_ids ?? []),
    getCompanyTickers(company.id),
    getCompanyExecutives(company.id),
    getArticlesForEntity("company", company.id, { limit: 20 }),
  ]);

  const primaryTicker = company.primary_ticker_id
    ? tickers.find((t) => t.id === company.primary_ticker_id) ?? null
    : null;

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <CompanyHero
        company={company}
        sectors={sectors}
        primaryTicker={primaryTicker}
      />

      {executives.length > 0 && (
        <section className="mb-12">
          <h2 className="display text-[28px] mb-6">Leadership</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {executives.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/person/${e.slug}`}
                  className="block p-4 rounded-xl border border-rule hover:border-accent transition"
                >
                  <div className="font-bold text-[15px]">{e.name}</div>
                  {e.role && (
                    <div className="text-[12px] text-soft mt-1">{e.role}</div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tickers.length > 1 && (
        <section className="mb-12">
          <h2 className="display text-[28px] mb-6">Listings</h2>
          <ul className="flex flex-wrap gap-2">
            {tickers.map((t) => (
              <li key={t.id}>
                <Link href={`/ticker/${t.slug}`} className="ticker-inline">
                  {t.exchange}:{t.symbol}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="display text-[28px] mb-6">Articles</h2>
        {articles.length === 0 ? (
          <p className="text-soft text-[15px] py-6">
            No articles yet mention {company.name}.
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
