// supabase/functions/entity-enrich/wikipedia.ts
// Thin Wikipedia API client. We hit the action API with prop=pageimages,
// which returns the page's main thumbnail. Disambiguation hits are
// reduced by retrying with role + company qualifiers.

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const UA = 'BusinessFortitudeBot/1.0 (+https://www.businessfortitude.com/bot)';

export interface WikiPhoto {
  url: string;
  width: number;
  height: number;
}

interface WikiPage {
  thumbnail?: { source?: string; width?: number; height?: number };
}

interface WikiResponse {
  query?: { pages?: Record<string, WikiPage> };
}

export async function lookupPhoto(name: string): Promise<WikiPhoto | null> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: name,
    prop: 'pageimages',
    pithumbsize: '400',
    redirects: '1',
    origin: '*',
  });
  let res: Response;
  try {
    res = await fetch(`${WIKI_API}?${params}`, {
      headers: { 'User-Agent': UA },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let json: WikiResponse;
  try {
    json = (await res.json()) as WikiResponse;
  } catch {
    return null;
  }
  const pages = json.query?.pages;
  if (!pages) return null;
  const firstKey = Object.keys(pages)[0];
  // Wikipedia returns key "-1" when the page doesn't exist.
  if (!firstKey || firstKey === '-1') return null;
  const page = pages[firstKey];
  const thumb = page?.thumbnail;
  if (!thumb?.source || !thumb.width || !thumb.height) return null;
  return { url: thumb.source, width: thumb.width, height: thumb.height };
}

// Disambiguation gate: try the bare name first, then qualified forms.
// Wikipedia has good redirects so name-only often resolves; the
// qualifier passes are belt-and-braces for common collisions
// (Andrew Bailey: Bank of England Governor vs footballer, etc.).
export async function lookupPersonPhoto(
  name: string,
  role: string | null,
  company: string | null,
): Promise<WikiPhoto | null> {
  const found = await lookupPhoto(name);
  if (found) return found;
  if (role) {
    const r = await lookupPhoto(`${name} ${role.toLowerCase()}`);
    if (r) return r;
  }
  if (company) {
    const c = await lookupPhoto(`${name} ${company}`);
    if (c) return c;
  }
  return null;
}
