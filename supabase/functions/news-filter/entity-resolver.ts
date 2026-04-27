// supabase/functions/news-filter/entity-resolver.ts
// Best-effort case-insensitive name → entity-id resolution.
// The entity tables are empty until a future seeding session, so every
// call here returns []. The code is shaped to do the right thing once
// the tables get populated; no further changes needed at that point.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Client = SupabaseClient;

async function resolveByNameOrAlias(
  client: Client,
  table: 'companies' | 'executives' | 'sectors',
  names: string[],
): Promise<string[]> {
  if (!names.length) return [];
  const lower = names.map((n) => n.toLowerCase().trim()).filter(Boolean);
  if (!lower.length) return [];

  // Two queries (name match, alias overlap), unioned in JS. Keeps the
  // postgrest interface simple and avoids needing a custom RPC.
  const [byName, byAlias] = await Promise.all([
    client.from(table).select('id, name').in('name', names),
    client.from(table).select('id, aliases').overlaps('aliases', names),
  ]);

  const ids = new Set<string>();
  // deno-lint-ignore no-explicit-any
  for (const row of (byName.data ?? []) as any[]) {
    if (lower.includes(String(row.name).toLowerCase())) ids.add(row.id);
  }
  // deno-lint-ignore no-explicit-any
  for (const row of (byAlias.data ?? []) as any[]) {
    ids.add(row.id);
  }
  return [...ids];
}

export function resolveCompanies(client: Client, names: string[]): Promise<string[]> {
  return resolveByNameOrAlias(client, 'companies', names);
}

export function resolveExecutives(client: Client, names: string[]): Promise<string[]> {
  return resolveByNameOrAlias(client, 'executives', names);
}

export function resolveSectors(client: Client, names: string[]): Promise<string[]> {
  return resolveByNameOrAlias(client, 'sectors', names);
}

export async function resolveTickers(client: Client, symbols: string[]): Promise<string[]> {
  if (!symbols.length) return [];
  const upper = symbols.map((s) => s.toUpperCase().trim()).filter(Boolean);
  if (!upper.length) return [];
  const { data } = await client.from('tickers').select('id, symbol').in('symbol', upper);
  // deno-lint-ignore no-explicit-any
  return ((data ?? []) as any[]).map((r) => r.id);
}
