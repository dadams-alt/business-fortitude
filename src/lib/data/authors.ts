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
  // Legacy authors from the Lovable archive. Some legacy posts still
  // reference the deprecated 'david' / 'ross' slugs from before cleaner
  // 'david-adams' / 'ross-williams' versions were created — both kept
  // so byline links don't 404. Photo URLs were mirrored from the old
  // Lovable storage into news-images/authors/ on the BF prod project
  // during the DNS cutover batch.
  'david-adams': {
    slug: 'david-adams',
    name: 'David Adams',
    role: 'Co-founder · London',
    bio: 'Co-founder of Business Fortitude. Thirteen years in B2B technology and subscription platforms, finishing as Chief Operating Officer. Built and scaled partner ecosystems covering more than 1,500 relationships globally and managed over $30m in annual B2B partner revenue. Founding Partner at Lucennio Consultancy. Writes occasionally on B2B operations, GTM automation, and revenue pipeline.',
    photoUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/david-adams.jpeg',
    avatarUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/david-adams.jpeg',
  },
  david: {
    slug: 'david',
    name: 'David Adams',
    role: 'Co-founder · London',
    bio: 'Co-founder of Business Fortitude. Thirteen years in B2B technology and subscription platforms, finishing as Chief Operating Officer. Built and scaled partner ecosystems covering more than 1,500 relationships globally and managed over $30m in annual B2B partner revenue. Founding Partner at Lucennio Consultancy. Writes occasionally on B2B operations, GTM automation, and revenue pipeline.',
    photoUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/david-adams.jpeg',
    avatarUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/david-adams.jpeg',
  },
  'ross-williams': {
    slug: 'ross-williams',
    name: 'Ross Williams',
    role: 'Co-founder · London',
    bio: 'Co-founder of Business Fortitude. Founded Venntro Media Group in 2003, bootstrapping it to nearly $50m annual revenue and powering more than 1,000 subscription brands globally before its acquisition by Ambervine in 2024. EY Entrepreneur of the Year and author of Subscribe and Conquer. Writes on subscription strategy, leadership, and long-horizon operating.',
    photoUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/ross-williams.jpeg',
    avatarUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/ross-williams.jpeg',
  },
  ross: {
    slug: 'ross',
    name: 'Ross Williams',
    role: 'Co-founder · London',
    bio: 'Co-founder of Business Fortitude. Founded Venntro Media Group in 2003, bootstrapping it to nearly $50m annual revenue and powering more than 1,000 subscription brands globally before its acquisition by Ambervine in 2024. EY Entrepreneur of the Year and author of Subscribe and Conquer. Writes on subscription strategy, leadership, and long-horizon operating.',
    photoUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/ross-williams.jpeg',
    avatarUrl:
      'https://lsdjxhqocslefawseotl.supabase.co/storage/v1/object/public/news-images/authors/ross-williams.jpeg',
  },
  'business-fortitude-team': {
    slug: 'business-fortitude-team',
    name: 'Business Fortitude Team',
    role: 'Editorial Team',
    bio: 'The editorial team at Business Fortitude, delivering insights and analysis on business, finance, and leadership.',
    photoUrl: 'https://i.pravatar.cc/240?img=8',
    avatarUrl: 'https://i.pravatar.cc/64?img=8',
  },
} as const;

export type Author = (typeof AUTHORS)[keyof typeof AUTHORS];
export type AuthorSlug = keyof typeof AUTHORS;

export function getAuthor(slug: string): Author | null {
  return slug in AUTHORS ? AUTHORS[slug as AuthorSlug] : null;
}
