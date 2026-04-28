// supabase/functions/news-publish/revalidate.ts
// Hits /api/revalidate on the live Next.js app to trigger ISR.
// Best-effort — failure means the page updates on the next ISR tick
// (60s for /, 300s for /article/[slug]) instead of immediately.

export interface RevalidateConfig {
  siteUrl: string;
  token: string;
}

export interface RevalidateResult {
  ok: boolean;
  status: number;
  body?: string;
}

export async function revalidatePaths(
  cfg: RevalidateConfig,
  paths: string[],
): Promise<RevalidateResult> {
  if (!paths.length) return { ok: true, status: 0 };
  const response = await fetch(`${cfg.siteUrl}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paths }),
  });
  const result: RevalidateResult = { ok: response.ok, status: response.status };
  if (!response.ok) {
    try {
      result.body = (await response.text()).slice(0, 300);
    } catch {
      // ignore
    }
  }
  return result;
}
