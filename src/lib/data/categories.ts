// src/lib/data/categories.ts
// The seven canonical editorial verticals plus eight legacy verticals
// preserved from the Lovable archive (migrations 005 + 016). Header nav,
// homepage filter strip, and other surfaces reference the 7 canonical
// slugs by name; the legacy entries exist so /category/<old-slug> URLs
// continue to render after the DNS cutover. Each legacy entry has
// archive: true for any surface that wants to filter them out.

export const CATEGORIES = {
  markets: {
    slug: 'markets',
    name: 'Markets',
    description:
      'Public equity markets, indices, currency, rates, earnings season analysis.',
    chipVariant: 'accent',
    archive: false,
  },
  deals: {
    slug: 'deals',
    name: 'Deals',
    description: 'M&A, fundraising, IPOs, private equity, capital flows.',
    chipVariant: 'accent',
    archive: false,
  },
  leadership: {
    slug: 'leadership',
    name: 'Leadership',
    description:
      'CEO and board moves, governance, executive judgment, organisational design.',
    chipVariant: 'ink',
    archive: false,
  },
  ai: {
    slug: 'ai',
    name: 'AI',
    description:
      'Applied AI in business operations, infrastructure economics, model deployments.',
    chipVariant: 'lime',
    archive: false,
  },
  startups: {
    slug: 'startups',
    name: 'Startups',
    description:
      'UK and Europe scale-up news. Funding, product launches, founder profiles.',
    chipVariant: 'default',
    archive: false,
  },
  regulation: {
    slug: 'regulation',
    name: 'Regulation',
    description:
      'HMRC, FCA, DBT, Bank of England, Companies House, EU policy affecting UK business.',
    chipVariant: 'outline',
    archive: false,
  },
  opinion: {
    slug: 'opinion',
    name: 'Opinion',
    description: 'Op-eds and analytical commentary.',
    chipVariant: 'lime',
    archive: false,
  },
  // Legacy verticals from the Lovable export. Kept verbatim so old URLs
  // still resolve to a category page; not surfaced in nav.
  'marketing-growth': {
    slug: 'marketing-growth',
    name: 'Marketing & Growth',
    description:
      'Archive: marketing strategies, growth, brand building, campaign insights.',
    chipVariant: 'default',
    archive: true,
  },
  'finance-economy': {
    slug: 'finance-economy',
    name: 'Finance & Economy',
    description:
      'Archive: financial news, markets, funding, economic policy, investment trends.',
    chipVariant: 'default',
    archive: true,
  },
  'industry-watch': {
    slug: 'industry-watch',
    name: 'Industry Watch',
    description: 'Archive: cross-industry trends and sector analysis.',
    chipVariant: 'default',
    archive: true,
  },
  'leadership-people': {
    slug: 'leadership-people',
    name: 'Leadership & People',
    description:
      'Archive: leadership, organisational design, people-focused stories.',
    chipVariant: 'default',
    archive: true,
  },
  'policy-regulation': {
    slug: 'policy-regulation',
    name: 'Policy & Regulation',
    description: 'Archive: policy, regulation, and compliance coverage.',
    chipVariant: 'default',
    archive: true,
  },
  news: {
    slug: 'news',
    name: 'News',
    description: 'Archive: general business news.',
    chipVariant: 'default',
    archive: true,
  },
  'tech-innovation': {
    slug: 'tech-innovation',
    name: 'Tech & Innovation',
    description: 'Archive: technology and innovation stories.',
    chipVariant: 'default',
    archive: true,
  },
  'opinion-analysis': {
    slug: 'opinion-analysis',
    name: 'Opinion & Analysis',
    description: 'Archive: op-eds and analytical commentary.',
    chipVariant: 'default',
    archive: true,
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

export function isValidCategory(slug: string): slug is CategorySlug {
  return slug in CATEGORIES;
}

export const ACTIVE_CATEGORY_SLUGS: CategorySlug[] = (
  Object.keys(CATEGORIES) as CategorySlug[]
).filter((slug) => !CATEGORIES[slug].archive);
