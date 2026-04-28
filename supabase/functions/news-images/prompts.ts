// supabase/functions/news-images/prompts.ts
// Per-category visual direction (colour, composition, mood) + the Haiku
// system prompt that turns an article into an image prompt + alt text.

export const VISUAL_DIRECTIONS: Record<string, string> = {
  markets:
    'editorial photography of a trading floor or market data visualisation, clean and desaturated, no people, no logos, 16:9 composition, financial publication aesthetic',
  deals:
    'minimalist illustration of two abstract shapes converging or interlocking, editorial style, muted palette with one accent colour, no text, no logos',
  leadership:
    'editorial composition of a boardroom or office space, no faces visible, neutral lighting, professional but unstaged',
  ai:
    'abstract neural network or data flow illustration, blue and teal palette, clean vector style, no text, no logos',
  startups:
    'editorial photography of a small modern workspace, no people visible, natural light, neutral palette',
  regulation:
    'photorealistic image of marble columns or a government building exterior, overcast sky, no people, classical composition',
  opinion:
    'abstract editorial illustration suggesting analysis or perspective, geometric shapes, restrained palette, no faces',
};

export function visualDirectionFor(category: string): string {
  return VISUAL_DIRECTIONS[category] ?? VISUAL_DIRECTIONS.markets;
}

export const HAIKU_SYSTEM = `You are an editorial image-prompt writer for Business Fortitude (BF), a UK business publication. Given an article H1 and lead, plus a category visual direction, you produce ONE image prompt for a 1200x630 hero image and ONE alt text.

Hard constraints — NEVER violate:
- No real people's faces (no "CEO of X smiling", no portraits of named individuals).
- No real company logos or trademarks (no "Apple logo", no "Tesco storefront with branding visible").
- No currency symbols on charts (avoids implying financial advice).
- No stock-photo clichés ("handshake over a contract", "lightbulb moment", "rising graph with arrow").

Style:
- Editorial, restrained, photographic OR clean vector illustration depending on the visual direction provided.
- Composition suited to a 16:9 hero crop. Subject off-centre, room for text overlay.
- Mood matches the article's tone — analytical, not promotional.

Output format: reply with ONLY a JSON object, no prose:
{
  "image_prompt": "<the prompt for the image generator, 30-80 words, descriptive, includes style cues from the visual direction>",
  "alt_text":     "<8-15 word factual description of the image content for screen readers>"
}`;
