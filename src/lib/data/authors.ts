// src/lib/data/authors.ts
// The 5 byline authors the autonomous pipeline currently uses. Slugs
// MUST match supabase/functions/news-write/authors.ts — that's the
// source the pipeline writes into articles.author_slug.
//
// If a future article ships with an unknown author_slug, /author/[slug]
// will 404 and any byline link to it will 404. That's intentional —
// the gap surfaces and we can add the entry here.

export const AUTHORS = {
  'sarah-mendel': {
    slug: 'sarah-mendel',
    name: 'Sarah Mendel',
    role: 'Markets editor · London',
    bio: 'Markets editor at Business Fortitude. Twelve years covering UK equities, previously at Reuters and the Telegraph. Writes the weekly Repricing column.',
    photoUrl: 'https://i.pravatar.cc/240?img=47',
    avatarUrl: 'https://i.pravatar.cc/64?img=47',
  },
  'marcus-holden': {
    slug: 'marcus-holden',
    name: 'Marcus Holden',
    role: 'Deals desk · London',
    bio: 'Deals desk lead at Business Fortitude. Covers UK M&A, fundraising, and capital markets. Previously at the Financial Times deals team.',
    photoUrl: 'https://i.pravatar.cc/240?img=12',
    avatarUrl: 'https://i.pravatar.cc/64?img=12',
  },
  'priya-shah': {
    slug: 'priya-shah',
    name: 'Priya Shah',
    role: 'AI & technology · London',
    bio: 'AI and technology correspondent at Business Fortitude. Focuses on the operator-relevant economics of AI deployment. Background in software engineering.',
    photoUrl: 'https://i.pravatar.cc/240?img=44',
    avatarUrl: 'https://i.pravatar.cc/64?img=44',
  },
  'nadia-carson': {
    slug: 'nadia-carson',
    name: 'Nadia Carson',
    role: 'Leadership · London',
    bio: 'Leadership correspondent at Business Fortitude. Covers boardroom moves, governance, and organisational design at UK SMEs and scale-ups.',
    photoUrl: 'https://i.pravatar.cc/240?img=32',
    avatarUrl: 'https://i.pravatar.cc/64?img=32',
  },
  'aisha-williams': {
    slug: 'aisha-williams',
    name: 'Aisha Williams',
    role: 'Startups · London',
    bio: 'Startups and scale-ups correspondent at Business Fortitude. Reports on UK and European founder stories, growth-stage operations, and venture markets.',
    photoUrl: 'https://i.pravatar.cc/240?img=20',
    avatarUrl: 'https://i.pravatar.cc/64?img=20',
  },
} as const;

export type Author = (typeof AUTHORS)[keyof typeof AUTHORS];
export type AuthorSlug = keyof typeof AUTHORS;

export function getAuthor(slug: string): Author | null {
  return slug in AUTHORS ? AUTHORS[slug as AuthorSlug] : null;
}
