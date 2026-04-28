// src/lib/data/categories.ts
// The seven editorial verticals BF publishes under. Slugs match the
// articles.category CHECK constraint (migration 005). Order here is
// the canonical display order — header nav and the homepage filter
// strip reuse it.

export const CATEGORIES = {
  markets: {
    slug: 'markets',
    name: 'Markets',
    description:
      'Public equity markets, indices, currency, rates, earnings season analysis.',
    chipVariant: 'accent',
  },
  deals: {
    slug: 'deals',
    name: 'Deals',
    description: 'M&A, fundraising, IPOs, private equity, capital flows.',
    chipVariant: 'accent',
  },
  leadership: {
    slug: 'leadership',
    name: 'Leadership',
    description:
      'CEO and board moves, governance, executive judgment, organisational design.',
    chipVariant: 'ink',
  },
  ai: {
    slug: 'ai',
    name: 'AI',
    description:
      'Applied AI in business operations, infrastructure economics, model deployments.',
    chipVariant: 'lime',
  },
  startups: {
    slug: 'startups',
    name: 'Startups',
    description:
      'UK and Europe scale-up news. Funding, product launches, founder profiles.',
    chipVariant: 'default',
  },
  regulation: {
    slug: 'regulation',
    name: 'Regulation',
    description:
      'HMRC, FCA, DBT, Bank of England, Companies House, EU policy affecting UK business.',
    chipVariant: 'outline',
  },
  opinion: {
    slug: 'opinion',
    name: 'Opinion',
    description: 'Op-eds and analytical commentary.',
    chipVariant: 'lime',
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

export function isValidCategory(slug: string): slug is CategorySlug {
  return slug in CATEGORIES;
}
