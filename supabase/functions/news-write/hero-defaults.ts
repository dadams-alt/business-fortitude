// supabase/functions/news-write/hero-defaults.ts
// Per-category Unsplash hero. Same set the homepage seeding script
// used; news-images will replace these with generated images later.

export interface HeroDefault {
  url: string;
  alt: string;
  credit: string;
}

export const HERO_BY_CATEGORY: Record<string, HeroDefault> = {
  markets: {
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1800&q=85',
    alt: 'Trading floor monitors with market charts',
    credit: 'Photo: Unsplash',
  },
  deals: {
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1800&q=85',
    alt: 'Two business people shaking hands',
    credit: 'Photo: Unsplash',
  },
  leadership: {
    url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1800&q=85',
    alt: 'A boardroom table with documents',
    credit: 'Photo: Unsplash',
  },
  ai: {
    url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1800&q=85',
    alt: 'Abstract neural network in blue tones',
    credit: 'Photo: Unsplash',
  },
  startups: {
    url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1800&q=85',
    alt: 'A small team working at a desk',
    credit: 'Photo: Unsplash',
  },
  regulation: {
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1800&q=85',
    alt: 'Government building columns',
    credit: 'Photo: Unsplash',
  },
  opinion: {
    url: 'https://i.pravatar.cc/1200?img=12',
    alt: 'Editorial portrait placeholder',
    credit: 'Photo: Pravatar',
  },
};

export function heroForCategory(category: string): HeroDefault {
  return HERO_BY_CATEGORY[category] ?? HERO_BY_CATEGORY.markets;
}
