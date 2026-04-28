"use client";

// src/components/site/header.tsx
// Sticky top nav with usePathname-driven active state. Categories are
// drawn from src/lib/data/categories.ts so the nav order matches the
// canonical display order across the site.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/data/categories";

const NAV_ITEMS: Array<{ label: string; href: string }> = [
  { label: "Latest", href: "/" },
  // The 6 categories that surface in nav. 'regulation' is omitted from
  // the top bar to keep it compact; readers reach it from the footer
  // or sitemap.
  { label: CATEGORIES.markets.name, href: "/category/markets" },
  { label: CATEGORIES.deals.name, href: "/category/deals" },
  { label: CATEGORIES.leadership.name, href: "/category/leadership" },
  { label: CATEGORIES.ai.name, href: "/category/ai" },
  { label: CATEGORIES.startups.name, href: "/category/startups" },
  { label: CATEGORIES.opinion.name, href: "/category/opinion" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-rule bg-white sticky top-0 z-40">
      <div className="max-w-[1360px] mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="display text-[22px]">
            Business <span className="text-accent">Fortitude</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "px-3 py-1.5 rounded-full text-[13px] font-medium bg-ink text-white"
                    : "px-3 py-1.5 rounded-full text-[13px] font-medium hover:bg-surface transition"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className="p-2 hover:bg-surface rounded-full"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <a href="#" className="hidden md:inline btn-primary text-[13px]">
            Subscribe
          </a>
        </div>
      </div>
    </header>
  );
}
