// src/app/sector/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSectorBySlug,
  getSectorCompanies,
  getArticlesForEntity,
  listSectors,
} from "@/lib/queries/entities";
import { SectorHero } from "@/components/entity/sector-hero";
import { StoryCard } from "@/components/article/story-card";

export const revalidate = 600;

export async function generateStaticParams() {
  const sectors = await listSectors();
  return sectors.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSectorBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.name} — Business Fortitude`,
    description: s.description ?? `${s.name} on Business Fortitude.`,
  };
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();

  const [companies, articles] = await Promise.all([
    getSectorCompanies(sector.id, { limit: 60 }),
    getArticlesForEntity("sector", sector.id, { limit: 20 }),
  ]);

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <SectorHero sector={sector} />

      {companies.length > 0 && (
        <section className="mb-12">
          <h2 className="display text-[28px] mb-6">Companies</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/company/${c.slug}`}
                  className="block p-4 rounded-xl border border-rule hover:border-accent transition"
                >
                  <div className="font-bold text-[15px]">{c.name}</div>
                  {c.hq_country && (
                    <div className="text-[12px] text-soft mt-1">
                      {c.hq_country}
                    </div>
                  )}
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
            No articles yet tagged with {sector.name}.
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
