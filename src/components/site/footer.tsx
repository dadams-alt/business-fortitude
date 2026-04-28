// src/components/site/footer.tsx
// Lifted from mockups/02-modern-business-tech.html L350–379.
// "Read" column links to real category routes; the other three columns
// remain placeholder until those features land.

import Link from "next/link";

interface ReadLink {
  label: string;
  href: string;
}

const READ_LINKS: ReadLink[] = [
  { label: "Latest", href: "/" },
  { label: "Markets", href: "/category/markets" },
  { label: "Leadership", href: "/category/leadership" },
  { label: "Opinion", href: "/category/opinion" },
];

const PLACEHOLDER_COLUMNS: Array<{ heading: string; links: string[] }> = [
  { heading: "Pro", links: ["Roundtables", "Model portfolios", "Deal database"] },
  { heading: "Company", links: ["About", "Careers", "Advertise"] },
  { heading: "Legal", links: ["Privacy", "Terms", "Cookies"] },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white mt-10">
      <div className="max-w-[1360px] mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-6 gap-8 text-[13px]">
        <div className="col-span-2">
          <div className="display text-[26px] mb-3">
            Business <span className="text-accent">Fortitude</span>
          </div>
          <p className="opacity-70 leading-relaxed max-w-xs">
            Independent journalism for operators, founders, and boards.
            Published in London.
          </p>
        </div>
        <div>
          <div className="kicker opacity-60 mb-3">Read</div>
          <ul className="space-y-2">
            {READ_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-lime">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {PLACEHOLDER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <div className="kicker opacity-60 mb-3">{col.heading}</div>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-lime">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 text-[12px]">
        <div className="max-w-[1360px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 opacity-70">
          <span>© 2026 Business Fortitude Ltd.</span>
          <span>Not investment advice. Capital at risk.</span>
        </div>
      </div>
    </footer>
  );
}
