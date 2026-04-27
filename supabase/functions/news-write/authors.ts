// supabase/functions/news-write/authors.ts
// Category → author map. Mirrors the seeding script. Sarah Mendel covers
// markets and regulation while we wait for an authors table.

export interface Author {
  name: string;
  slug: string;
}

export const AUTHOR_BY_CATEGORY: Record<string, Author> = {
  markets: { name: 'Sarah Mendel', slug: 'sarah-mendel' },
  deals: { name: 'Marcus Holden', slug: 'marcus-holden' },
  leadership: { name: 'Nadia Carson', slug: 'nadia-carson' },
  ai: { name: 'Priya Shah', slug: 'priya-shah' },
  startups: { name: 'Aisha Williams', slug: 'aisha-williams' },
  regulation: { name: 'Sarah Mendel', slug: 'sarah-mendel' },
  opinion: { name: 'Marcus Holden', slug: 'marcus-holden' },
};

export function authorForCategory(category: string): Author {
  return AUTHOR_BY_CATEGORY[category] ?? AUTHOR_BY_CATEGORY.markets;
}
