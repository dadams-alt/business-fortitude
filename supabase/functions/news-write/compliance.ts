// supabase/functions/news-write/compliance.ts
// Post-generation regex sweep. If any of these match, the article is
// reverted to 'ready' and re-queued — we treat compliance failure as a
// signal that the prompt's constraints leaked, and let a later run try
// again rather than publishing tainted copy.

const BANNED_REGEXES: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /\binvestors should\b/i, why: 'investment advice' },
  { pattern: /\bshares look (cheap|expensive)\b/i, why: 'investment advice' },
  { pattern: /\b(good|bad) time to (buy|sell)\b/i, why: 'investment advice' },
  { pattern: /\bbuy (the )?(stock|shares|dip)\b/i, why: 'investment advice' },
  { pattern: /\bsell (the )?(stock|shares)\b/i, why: 'investment advice' },
  { pattern: /—/, why: 'em-dash' },
  { pattern: /\bdelve\b/i, why: 'banned phrase: delve' },
  { pattern: /\bgame[- ]changing\b/i, why: 'banned phrase: game-changing' },
  { pattern: /\brevolutionary\b/i, why: 'banned phrase: revolutionary' },
];

export interface ComplianceResult {
  ok: boolean;
  hits: string[];
}

export function checkCompliance(bodyMd: string): ComplianceResult {
  const hits = BANNED_REGEXES.flatMap(({ pattern, why }) =>
    pattern.test(bodyMd) ? [why] : [],
  );
  return { ok: hits.length === 0, hits };
}
