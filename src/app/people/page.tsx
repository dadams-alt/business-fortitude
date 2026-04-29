// src/app/people/page.tsx

import type { Metadata } from "next";
import { listExecutives } from "@/lib/queries/entities";
import {
  AlphabeticalList,
  type AlphabeticalItem,
} from "@/components/entity/alphabetical-list";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "People — Business Fortitude",
  description: "Named individuals tracked by Business Fortitude.",
};

export default async function PeopleIndex() {
  const executives = await listExecutives();
  const items: AlphabeticalItem[] = executives.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    subtitle: e.role ?? undefined,
    href: `/person/${e.slug}`,
  }));
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <h1 className="display text-[44px] md:text-[56px] mb-2">People</h1>
      <p className="text-soft text-[16px] mb-10">
        {executives.length} individuals tracked.
      </p>
      <AlphabeticalList items={items} emptyLabel="No people yet." />
    </main>
  );
}
