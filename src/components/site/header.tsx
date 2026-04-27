// src/components/site/header.tsx
// Sticky top nav. Lifted from mockups/02-modern-business-tech.html L52–73.
// Nav links are placeholders (#) for v1 — only the logo links to /.

import Link from "next/link";

const NAV = [
  { label: "Latest", href: "/", active: true },
  { label: "Markets", href: "#" },
  { label: "Deals", href: "#" },
  { label: "Leadership", href: "#" },
  { label: "AI", href: "#" },
  { label: "Startups", href: "#" },
  { label: "Opinion", href: "#" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-white sticky top-0 z-40">
      <div className="max-w-[1360px] mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="display text-[22px]">
            Business <span className="text-accent">Fortitude</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                item.active
                  ? "px-3 py-1.5 rounded-full text-[13px] font-medium bg-ink text-white"
                  : "px-3 py-1.5 rounded-full text-[13px] font-medium hover:bg-surface"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
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
          </button>
          <a href="#" className="hidden md:inline btn-primary text-[13px]">
            Subscribe
          </a>
        </div>
      </div>
    </header>
  );
}
