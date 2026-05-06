"use client";

// src/components/site/header.tsx
// Sticky top nav with usePathname-driven active state. Categories are
// drawn from src/lib/data/categories.ts so the nav order matches the
// canonical display order across the site. At narrow viewports the nav
// collapses behind a hamburger toggle.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/data/categories";

const NAV_ITEMS: Array<{ label: string; href: string }> = [
  { label: "Latest", href: "/" },
  { label: CATEGORIES.markets.name, href: "/category/markets" },
  { label: CATEGORIES.deals.name, href: "/category/deals" },
  { label: CATEGORIES.leadership.name, href: "/category/leadership" },
  { label: CATEGORIES.ai.name, href: "/category/ai" },
  { label: CATEGORIES.startups.name, href: "/category/startups" },
  { label: CATEGORIES.opinion.name, href: "/category/opinion" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

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
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden p-2 hover:bg-surface rounded-full"
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="lg:hidden fixed inset-0 top-16 z-30 bg-ink/40"
          />
          <nav
            id="mobile-nav"
            className="lg:hidden absolute left-0 right-0 top-16 z-40 bg-white border-b border-rule shadow-lg"
          >
            <ul className="max-w-[1360px] mx-auto px-6 py-4 flex flex-col">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={
                        active
                          ? "block py-3 text-[15px] font-medium text-accent"
                          : "block py-3 text-[15px] font-medium hover:text-accent transition"
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-3 mt-2 border-t border-rule">
                <a href="#" className="btn-primary inline-block text-[14px]">
                  Subscribe
                </a>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
