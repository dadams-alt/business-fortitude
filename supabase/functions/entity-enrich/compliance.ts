// supabase/functions/entity-enrich/compliance.ts
// Local copy of news-write/compliance.ts. The Supabase deployer bundles
// each function's directory plus _shared/, and cross-function imports
// aren't part of the standard contract — keeping this duplicated here
// trades 30 lines of duplication for deployment robustness.
//
// Keep in sync with news-write/compliance.ts. Both should fail on the
// same banned-phrase patterns so the editorial voice rules don't drift
// between writing and enrichment outputs.

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

export function checkCompliance(text: string): ComplianceResult {
  const hits = BANNED_REGEXES.flatMap(({ pattern, why }) =>
    pattern.test(text) ? [why] : [],
  );
  return { ok: hits.length === 0, hits };
}
