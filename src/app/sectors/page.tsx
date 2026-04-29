// src/app/sectors/page.tsx

import Link from "next/link";
import type { Metadata } from "next";
import { listSectors } from "@/lib/queries/entities";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Sectors — Business Fortitude",
  description: "Industry sectors tracked by Business Fortitude.",
};

export default async function SectorsIndex() {
  const sectors = await listSectors();
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <h1 className="display text-[44px] md:text-[56px] mb-2">Sectors</h1>
      <p className="text-soft text-[16px] mb-10">
        {sectors.length} sectors. Each is a slice of how BF covers the
        market.
      </p>
      {sectors.length === 0 ? (
        <p className="text-soft py-12">No sectors yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sector/${s.slug}`}
                className="block p-5 rounded-xl border border-rule hover:border-accent transition"
              >
                <div className="font-bold text-[17px] mb-1">{s.name}</div>
                {s.description && (
                  <p className="text-[13px] text-soft leading-[1.5]">
                    {s.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
