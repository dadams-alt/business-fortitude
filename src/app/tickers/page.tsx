// src/app/tickers/page.tsx
// Tickers index. Table format — exchange / symbol / company name / currency.

import Link from "next/link";
import type { Metadata } from "next";
import { listTickers } from "@/lib/queries/entities";
import { createAnonClient } from "@/lib/supabase/anon";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Tickers — Business Fortitude",
  description:
    "Listed equities tracked by Business Fortitude across LSE, NASDAQ, and other exchanges.",
};

export default async function TickersIndex() {
  const tickers = await listTickers();

  // Pull the company name in a single round-trip rather than N+1.
  const companyIds = Array.from(
    new Set(tickers.map((t) => t.company_id).filter((id): id is string => !!id)),
  );
  const { data: companies } = companyIds.length
    ? await createAnonClient()
        .from("companies")
        .select("id, name, slug")
        .in("id", companyIds)
    : { data: [] as Array<{ id: string; name: string; slug: string }> };
  const companyById = new Map((companies ?? []).map((c) => [c.id, c]));

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-10">
      <h1 className="display text-[44px] md:text-[56px] mb-2">Tickers</h1>
      <p className="text-soft text-[16px] mb-10">
        {tickers.length} listings tracked across {new Set(tickers.map((t) => t.exchange)).size}{" "}
        exchanges.
      </p>
      {tickers.length === 0 ? (
        <p className="text-soft py-12">No tickers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full text-[14px]">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3 font-mono uppercase tracking-widest text-[11px] text-soft">
                  Exchange
                </th>
                <th className="px-4 py-3 font-mono uppercase tracking-widest text-[11px] text-soft">
                  Symbol
                </th>
                <th className="px-4 py-3 font-mono uppercase tracking-widest text-[11px] text-soft">
                  Company
                </th>
                <th className="px-4 py-3 font-mono uppercase tracking-widest text-[11px] text-soft">
                  Currency
                </th>
              </tr>
            </thead>
            <tbody>
              {tickers.map((t) => {
                const co = t.company_id ? companyById.get(t.company_id) : null;
                return (
                  <tr key={t.id} className="border-t border-rule hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono">{t.exchange}</td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <Link href={`/ticker/${t.slug}`} className="hover:text-accent">
                        {t.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {co ? (
                        <Link
                          href={`/company/${co.slug}`}
                          className="hover:text-accent"
                        >
                          {co.name}
                        </Link>
                      ) : (
                        <span className="text-soft">{t.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-soft">{t.currency ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
