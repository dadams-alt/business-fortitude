// supabase/functions/news-ingest-rss/content-hash.ts
// Canonical content_hash algorithm.
//
//   normalise(title) =  lowercase
//                    -> strip Unicode punctuation + symbols (\p{P}, \p{S})
//                    -> collapse runs of whitespace to a single space
//                    -> trim leading/trailing whitespace
//
//   content_hash    =  hex(sha256(normalise(title)))
//
// This algorithm MUST stay byte-stable. news-filter recomputes the same
// hash to detect duplicates by title, and any future migration that
// re-hashes existing rows will rely on this exact form. If you change
// it, write a migration that re-hashes the existing news_candidates
// rows in the same commit.

export function normalise(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}
