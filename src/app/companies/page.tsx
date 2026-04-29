// src/app/companies/page.tsx

import type { Metadata } from "next";
import { listCompanies } from "@/lib/queries/entities";
import {
  AlphabeticalList,
  type AlphabeticalItem,
} from "@/components/entity/alphabetical-list";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Companies — Business Fortitude",
  description: "Companies covered by Business Fortitude.",
};

export default async function CompaniesIndex() {
  const companies = await listCompanies();
  const items: AlphabeticalItem[] = companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    subtitle: c.hq_country ?? undefined,
    href: `/company/${c.slug}`,
  }));
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <h1 className="display text-[44px] md:text-[56px] mb-2">Companies</h1>
      <p className="text-soft text-[16px] mb-10">
        {companies.length} companies covered.
      </p>
      <AlphabeticalList items={items} emptyLabel="No companies yet." />
    </main>
  );
}
