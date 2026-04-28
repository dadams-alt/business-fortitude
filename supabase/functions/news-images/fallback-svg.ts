// supabase/functions/news-images/fallback-svg.ts
// Last-resort placeholder when Gemini fails. Renders a flat brand-colour
// card with the BF wordmark. SVG is fine for the news-images bucket —
// browsers serve it inline with image/svg+xml content-type.

const CATEGORY_COLORS: Record<string, string> = {
  markets: '#0055ff',
  deals: '#0a0a0a',
  leadership: '#4a4a4a',
  ai: '#0055ff',
  startups: '#d4ff3a',
  regulation: '#4a4a4a',
  opinion: '#d4ff3a',
};

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => {
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '&') return '&amp;';
    if (c === '"') return '&quot;';
    return '&apos;';
  });
}

export function generateFallbackSvg(category: string, _title: string): Uint8Array {
  const color = CATEGORY_COLORS[category] ?? '#0a0a0a';
  // Light text on dark categories, dark text on the lime ones.
  const lightCategories = new Set(['startups', 'opinion']);
  const fg = lightCategories.has(category) ? '#0a0a0a' : '#ffffff';
  const accent = '#d4ff3a';
  const cat = escapeXml(category.toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice">
    <rect width="1200" height="630" fill="${color}"/>
    <rect x="60" y="540" width="120" height="6" fill="${accent}"/>
    <text x="60" y="510" fill="${fg}" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="48" letter-spacing="-1">Business Fortitude</text>
    <text x="60" y="80" fill="${fg}" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="20" opacity="0.7">${cat}</text>
  </svg>`;
  return new TextEncoder().encode(svg);
}
