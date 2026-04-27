// supabase/functions/news-ingest-rss/feed-parser.ts
// fast-xml-parser wrapper that turns RSS 2.0 or Atom 1.0 XML into a
// uniform FeedItem[]. Both formats coalesce into the same shape so the
// orchestrator in index.ts doesn't branch on feed dialect.

import { XMLParser } from 'https://esm.sh/fast-xml-parser@4';
import type { FeedItem, ParsedFeed } from './types.ts';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Keep raw strings — don't auto-coerce numbers / booleans / dates.
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  // Disable in-parser entity expansion. fast-xml-parser caps expansion
  // at 1000 (anti-XXE) and the Guardian's RSS legitimately exceeds
  // that with named HTML entities in body copy. We post-decode common
  // HTML entities in pickText below.
  processEntities: false,
});

// Common HTML entities that survive processEntities:false. Numeric refs
// (&#NNN; / &#xHH;) are decoded via String.fromCodePoint. This is a
// titles+summaries-grade decoder, not a full HTML5 entity table.
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  pound: '£', euro: '€', cent: '¢', yen: '¥',
  copy: '©', reg: '®', trade: '™',
  bull: '•', middot: '·',
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, ref: string) => {
    if (ref[0] === '#') {
      const code = ref[1]?.toLowerCase() === 'x'
        ? parseInt(ref.slice(2), 16)
        : parseInt(ref.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code <= 0x10FFFF) {
        try { return String.fromCodePoint(code); } catch { return m; }
      }
      return m;
    }
    return ENTITIES[ref.toLowerCase()] ?? m;
  });
}

export function parseFeed(xml: string): ParsedFeed {
  const doc = parser.parse(xml);
  if (doc.rss) return parseRss2(doc.rss);
  if (doc.feed) return parseAtom(doc.feed);
  throw new Error('unknown feed format: no <rss> or <feed> root');
}

// deno-lint-ignore no-explicit-any
function parseRss2(rss: any): ParsedFeed {
  const channel = rss.channel ?? {};
  const raw = toArray(channel.item);
  // deno-lint-ignore no-explicit-any
  const items: FeedItem[] = raw.map((it: any) => ({
    title: pickText(it.title) ?? '',
    link: pickText(it.link),
    summary: pickText(it['content:encoded']) ?? pickText(it.description),
    pubDate: parseDate(pickText(it.pubDate) ?? pickText(it['dc:date'])),
    author: pickText(it['dc:creator']) ?? pickText(it.author),
    guid: pickText(it.guid),
  })).filter((it) => it.title.length > 0);
  return { items };
}

// deno-lint-ignore no-explicit-any
function parseAtom(feed: any): ParsedFeed {
  const raw = toArray(feed.entry);
  // deno-lint-ignore no-explicit-any
  const items: FeedItem[] = raw.map((e: any) => ({
    title: pickText(e.title) ?? '',
    link: pickAtomLink(e.link),
    summary: pickText(e.summary) ?? pickText(e.content),
    pubDate: parseDate(pickText(e.published) ?? pickText(e.updated)),
    author: pickAtomAuthor(e.author),
    guid: pickText(e.id),
  })).filter((it) => it.title.length > 0);
  return { items };
}

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

// Walks fast-xml-parser output to a string. Handles plain strings, the
// `#text` child node introduced when a tag has both attributes and a
// text body, and nested wrappers (rare but seen on type="xhtml" Atom
// titles).
function pickText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = decodeEntities(v).trim();
    return t.length > 0 ? t : null;
  }
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if ('#text' in obj) return pickText(obj['#text']);
  }
  return null;
}

// Atom <link> can be a string, a single object with @_href, or an array
// of objects with various rel attributes (alternate, self, edit, ...).
// Prefer rel="alternate" (or unspecified rel) and skip rel="self".
function pickAtomLink(link: unknown): string | null {
  if (link === undefined || link === null) return null;
  if (typeof link === 'string') return link.trim() || null;
  // deno-lint-ignore no-explicit-any
  const arr = toArray(link as any);
  for (const l of arr) {
    if (typeof l === 'string') {
      const s = l.trim();
      if (s) return s;
      continue;
    }
    if (typeof l !== 'object' || l === null) continue;
    const obj = l as Record<string, unknown>;
    const rel = obj['@_rel'];
    const href = obj['@_href'];
    if ((!rel || rel === 'alternate') && typeof href === 'string' && href.trim()) {
      return href.trim();
    }
  }
  // Fallback: any href.
  for (const l of arr) {
    if (typeof l === 'object' && l !== null) {
      const href = (l as Record<string, unknown>)['@_href'];
      if (typeof href === 'string' && href.trim()) return href.trim();
    }
  }
  return null;
}

function pickAtomAuthor(author: unknown): string | null {
  if (!author) return null;
  if (typeof author === 'string') return author.trim() || null;
  // deno-lint-ignore no-explicit-any
  const arr = toArray(author as any);
  for (const a of arr) {
    if (typeof a === 'string') return a.trim() || null;
    if (typeof a === 'object' && a !== null) {
      const name = (a as Record<string, unknown>).name;
      const t = pickText(name);
      if (t) return t;
    }
  }
  return null;
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
}
