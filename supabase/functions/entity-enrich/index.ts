// supabase/functions/entity-enrich/index.ts
// On-demand background enrichment for the entity directory. Pulls the
// next batch of companies / executives without descriptions or bios,
// asks Sonnet to write them, runs the same compliance regex sweep that
// news-write uses, and persists. Then a Wikipedia photo pass for
// executives without photo_url. The drain loop in the deploy script
// re-invokes until all three queues are empty.
//
// No schema changes. Sectors and tickers don't get enriched here:
// sectors have static descriptions from the seed; tickers don't carry
// bios.

import { createServiceClient } from '../_shared/supabase-client.ts';
import { isServiceRoleBearer } from '../_shared/auth.ts';
import { callAIJson } from '../_shared/news-ai.ts';
import { COMPANY_PROMPT, EXECUTIVE_PROMPT } from './prompts.ts';
import { checkCompliance } from './compliance.ts';
import { lookupPersonPhoto } from './wikipedia.ts';
import type {
  CompanyAIResponse,
  CompanyRow,
  EnrichError,
  EnrichResult,
  ExecutiveAIResponse,
  ExecutiveRow,
} from './types.ts';

const BATCH_COMPANIES = 5;
const BATCH_EXECUTIVES = 8;
const BATCH_PHOTOS = 30;
const WIKI_INTERVAL_MS = 1000;

type Client = ReturnType<typeof createServiceClient>;

Deno.serve(async (req) => {
  if (!isServiceRoleBearer(req.headers.get('Authorization'))) {
    return json({ error: 'unauthorised' }, 401);
  }

  const client = createServiceClient();
  const result: EnrichResult = {
    companies_enriched: 0,
    bios_enriched: 0,
    photos_found: 0,
    compliance_reverts: 0,
    companies_remaining: 0,
    bios_remaining: 0,
    photos_remaining: 0,
    errors: [],
  };

  await enrichCompanies(client, result);
  await enrichExecutives(client, result);
  await fillPhotos(client, result);
  await fillRemainingCounts(client, result);

  return json(result, 200);
});


// ---------- 1. Companies ----------

async function enrichCompanies(client: Client, result: EnrichResult): Promise<void> {
  const { data: rows, error } = await client
    .from('companies')
    .select('id, slug, name, description, sector_ids')
    .or('description.is.null,description.eq.')
    .order('name')
    .limit(BATCH_COMPANIES);

  // The .or() above only catches NULL or empty. Length<200 case requires a
  // separate query — postgrest doesn't expose a length filter. Take from
  // the same select but also pull short descriptions if the first batch
  // didn't fill.
  let candidates = (rows ?? []) as CompanyRow[];
  if (!error && candidates.length < BATCH_COMPANIES) {
    const remaining = BATCH_COMPANIES - candidates.length;
    const seenIds = new Set(candidates.map((c) => c.id));
    // Pull all non-null rows (90 companies fits comfortably under 1000)
    // so the JS-side length filter doesn't miss anything alphabetically
    // beyond an arbitrary slice.
    const { data: shortRows } = await client
      .from('companies')
      .select('id, slug, name, description, sector_ids')
      .not('description', 'is', null)
      .order('name')
      .limit(1000);
    const shorts = ((shortRows ?? []) as CompanyRow[])
      .filter((c) => !seenIds.has(c.id) && (c.description?.length ?? 0) < 200)
      .slice(0, remaining);
    candidates = [...candidates, ...shorts];
  }

  for (const company of candidates) {
    try {
      // Resolve sector names for the prompt context.
      const sectorNames = await loadSectorNames(client, company.sector_ids ?? []);
      const userMsg =
        `Company: ${company.name}\n` +
        `Slug: ${company.slug}\n` +
        `Sectors: ${sectorNames.length ? sectorNames.join(', ') : '(uncategorised)'}`;
      const ai = await callAIJson<CompanyAIResponse>({
        model: 'sonnet',
        system: COMPANY_PROMPT,
        user: userMsg,
        max_tokens: 1500,
        temperature: 0.5,
      });
      const description = (ai.description ?? '').trim();
      if (!description) {
        result.errors.push({
          slug: company.slug,
          kind: 'company',
          message: 'empty description',
        });
        continue;
      }
      const compliance = checkCompliance(description);
      if (!compliance.ok) {
        result.compliance_reverts++;
        result.errors.push({
          slug: company.slug,
          kind: 'company',
          message: `compliance: ${compliance.hits.join(', ')}`,
        });
        continue;
      }
      const { error: updateError } = await client
        .from('companies')
        .update({ description })
        .eq('id', company.id);
      if (updateError) {
        result.errors.push({
          slug: company.slug,
          kind: 'company',
          message: `update: ${updateError.message}`,
        });
        continue;
      }
      result.companies_enriched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ slug: company.slug, kind: 'company', message: msg });
    }
  }
}

async function loadSectorNames(client: Client, sectorIds: string[]): Promise<string[]> {
  if (!sectorIds.length) return [];
  const { data } = await client.from('sectors').select('name').in('id', sectorIds);
  // deno-lint-ignore no-explicit-any
  return ((data ?? []) as any[]).map((r) => r.name as string);
}


// ---------- 2. Executives (bios) ----------

async function enrichExecutives(client: Client, result: EnrichResult): Promise<void> {
  const { data: rawNull } = await client
    .from('executives')
    .select('id, slug, name, role, bio, current_company_id')
    .or('bio.is.null,bio.eq.')
    .order('name')
    .limit(BATCH_EXECUTIVES);

  let candidates = (rawNull ?? []) as ExecutiveRow[];
  if (candidates.length < BATCH_EXECUTIVES) {
    const remaining = BATCH_EXECUTIVES - candidates.length;
    const seenIds = new Set(candidates.map((c) => c.id));
    const { data: rawShort } = await client
      .from('executives')
      .select('id, slug, name, role, bio, current_company_id')
      .not('bio', 'is', null)
      .order('name')
      .limit(1000);
    const shorts = ((rawShort ?? []) as ExecutiveRow[])
      .filter((e) => !seenIds.has(e.id) && (e.bio?.length ?? 0) < 100)
      .slice(0, remaining);
    candidates = [...candidates, ...shorts];
  }

  for (const exec of candidates) {
    try {
      const companyName = await loadCompanyName(client, exec.current_company_id);
      const userMsg =
        `Person: ${exec.name}\n` +
        `Role: ${exec.role ?? '(not specified)'}\n` +
        `Current company: ${companyName ?? '(not specified)'}`;
      const ai = await callAIJson<ExecutiveAIResponse>({
        model: 'sonnet',
        system: EXECUTIVE_PROMPT,
        user: userMsg,
        max_tokens: 800,
        temperature: 0.5,
      });
      const bio = (ai.bio ?? '').trim();
      if (!bio) {
        result.errors.push({ slug: exec.slug, kind: 'executive', message: 'empty bio' });
        continue;
      }
      const compliance = checkCompliance(bio);
      if (!compliance.ok) {
        result.compliance_reverts++;
        result.errors.push({
          slug: exec.slug,
          kind: 'executive',
          message: `compliance: ${compliance.hits.join(', ')}`,
        });
        continue;
      }
      const { error: updateError } = await client
        .from('executives')
        .update({ bio })
        .eq('id', exec.id);
      if (updateError) {
        result.errors.push({
          slug: exec.slug,
          kind: 'executive',
          message: `update: ${updateError.message}`,
        });
        continue;
      }
      result.bios_enriched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ slug: exec.slug, kind: 'executive', message: msg });
    }
  }
}

async function loadCompanyName(client: Client, id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await client.from('companies').select('name').eq('id', id).maybeSingle();
  // deno-lint-ignore no-explicit-any
  return ((data as any)?.name as string | undefined) ?? null;
}


// ---------- 3. Executive photos via Wikipedia ----------

async function fillPhotos(client: Client, result: EnrichResult): Promise<void> {
  // Gate retries on photo_lookup_attempted_at so we don't re-query
  // Wikipedia for the same unmatched executives every drain. 30-day
  // window: long enough not to spam, short enough that newly-added
  // Wikipedia photos still get picked up.
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: rawRows } = await client
    .from('executives')
    .select('id, slug, name, role, current_company_id')
    .is('photo_url', null)
    .or(`photo_lookup_attempted_at.is.null,photo_lookup_attempted_at.lt.${cutoff}`)
    .order('name')
    .limit(BATCH_PHOTOS);
  const candidates = (rawRows ?? []) as ExecutiveRow[];

  let firstCall = true;
  for (const exec of candidates) {
    if (!firstCall) await sleep(WIKI_INTERVAL_MS);
    firstCall = false;
    try {
      const companyName = await loadCompanyName(client, exec.current_company_id);
      const photo = await lookupPersonPhoto(exec.name, exec.role, companyName);
      // Always stamp photo_lookup_attempted_at, even on miss. photo_url
      // stays NULL on miss; only set the URL on hit.
      const update: Record<string, unknown> = {
        photo_lookup_attempted_at: new Date().toISOString(),
      };
      if (photo) update.photo_url = photo.url;
      const { error: updateError } = await client
        .from('executives')
        .update(update)
        .eq('id', exec.id);
      if (updateError) {
        result.errors.push({
          slug: exec.slug,
          kind: 'photo',
          message: `update: ${updateError.message}`,
        });
        continue;
      }
      if (photo) result.photos_found++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ slug: exec.slug, kind: 'photo', message: msg });
    }
  }
}


// ---------- 4. Remaining counts ----------

async function fillRemainingCounts(client: Client, result: EnrichResult): Promise<void> {
  // photos_remaining counts only execs without a photo AND without a
  // recent attempt — same gate as the fillPhotos query. After one full
  // drain pass everyone has been attempted, so the queue empties even
  // when Wikipedia turned up nothing for them.
  const photosCutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [{ count: companiesNullOrEmpty }, allCompaniesWithDesc, { count: photosRemaining }] =
    await Promise.all([
      client
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .or('description.is.null,description.eq.'),
      client.from('companies').select('description').not('description', 'is', null),
      client
        .from('executives')
        .select('id', { count: 'exact', head: true })
        .is('photo_url', null)
        .or(`photo_lookup_attempted_at.is.null,photo_lookup_attempted_at.lt.${photosCutoff}`),
    ]);

  // Length-based remaining (postgrest can't filter by length, so compute in JS).
  const shortCompanies = (
    (allCompaniesWithDesc.data ?? []) as Array<{ description: string | null }>
  ).filter((r) => (r.description?.length ?? 0) < 200).length;
  result.companies_remaining = (companiesNullOrEmpty ?? 0) + shortCompanies;

  const [{ count: biosNullOrEmpty }, allExecsWithBio] = await Promise.all([
    client
      .from('executives')
      .select('id', { count: 'exact', head: true })
      .or('bio.is.null,bio.eq.'),
    client.from('executives').select('bio').not('bio', 'is', null),
  ]);
  const shortBios = ((allExecsWithBio.data ?? []) as Array<{ bio: string | null }>).filter(
    (r) => (r.bio?.length ?? 0) < 100,
  ).length;
  result.bios_remaining = (biosNullOrEmpty ?? 0) + shortBios;

  result.photos_remaining = photosRemaining ?? 0;
}


// ---------- helpers ----------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Surface unused-import lint silencing for narrow type re-exports
// the orchestrator doesn't directly reference at the value level.
type _Unused = EnrichError;
void (null as unknown as _Unused);
