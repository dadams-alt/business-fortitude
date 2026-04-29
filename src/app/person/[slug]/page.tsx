// src/app/person/[slug]/page.tsx
// URL is /person/<slug>, table is `executives`. The /author/[slug]
// route from yesterday is for BF byline authors (Sarah Mendel et al.);
// /person is for the wider entity directory of named individuals.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getExecutiveBySlug,
  getArticlesForEntity,
  listExecutives,
} from "@/lib/queries/entities";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Company } from "@/lib/queries/entities";
import { PersonHero } from "@/components/entity/person-hero";
import { StoryCard } from "@/components/article/story-card";

export const revalidate = 600;

export async function generateStaticParams() {
  const executives = await listExecutives();
  return executives.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await getExecutiveBySlug(slug);
  if (!e) return {};
  return {
    title: `${e.name} — Business Fortitude`,
    description: e.bio ?? `${e.name} on Business Fortitude.`,
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

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const executive = await getExecutiveBySlug(slug);
  if (!executive) notFound();

  const [company, articles] = await Promise.all([
    loadCompanyById(executive.current_company_id),
    getArticlesForEntity("executive", executive.id, { limit: 20 }),
  ]);

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <PersonHero executive={executive} company={company} />

      <section>
        <h2 className="display text-[28px] mb-6">Articles</h2>
        {articles.length === 0 ? (
          <p className="text-soft text-[15px] py-6">
            No articles yet mention {executive.name}.
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
