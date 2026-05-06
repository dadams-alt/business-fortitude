// src/app/not-found.tsx
// Next.js App Router 404. The root layout's <SiteHeader /> and
// <SiteFooter /> wrap this automatically, so we only render the
// in-page body — no need to repeat them.

import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/article/search-form";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you’re looking for doesn’t exist on Business Fortitude.",
};

export default function NotFound() {
  return (
    <main className="max-w-[1360px] mx-auto px-6 py-16 md:py-24">
      <div className="kicker text-soft mb-4">404</div>
      <h1 className="display text-[44px] md:text-[56px] leading-tight mb-6">
        This page doesn’t exist on Business Fortitude.
      </h1>
      <p className="text-soft text-[16px] max-w-2xl mb-10">
        The link may be outdated, mistyped, or the article may have moved.
        Try one of the routes below or search the archive.
      </p>
      <ul className="space-y-3 mb-12 text-[15px]">
        <li>
          <Link href="/" className="hover:text-accent">
            Back to the latest →
          </Link>
        </li>
        <li>
          <Link href="/category/markets" className="hover:text-accent">
            Browse markets coverage →
          </Link>
        </li>
        <li>
          <Link href="/companies" className="hover:text-accent">
            Companies directory →
          </Link>
        </li>
      </ul>
      <div className="border-t border-rule pt-8">
        <div className="kicker mb-3">Search the archive</div>
        <SearchForm />
      </div>
    </main>
  );
}
