// supabase/functions/news-publish/indexnow.ts
// Pings the IndexNow API so Bing/Yandex know to re-crawl. Best-effort:
// non-2xx responses are logged but do not fail the publish run.

const ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowConfig {
  host: string;       // 'business-fortitude.vercel.app'
  siteUrl: string;    // 'https://business-fortitude.vercel.app'
  key: string;
}

export interface IndexNowResult {
  ok: boolean;
  status: number;
  body?: string;
}

export async function pingIndexNow(
  cfg: IndexNowConfig,
  urls: string[],
): Promise<IndexNowResult> {
  if (!urls.length) return { ok: true, status: 0 };

  const body = {
    host: cfg.host,
    key: cfg.key,
    keyLocation: `${cfg.siteUrl}/${cfg.key}.txt`,
    urlList: urls,
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result: IndexNowResult = { ok: response.ok, status: response.status };
  if (!response.ok) {
    try {
      result.body = (await response.text()).slice(0, 300);
    } catch {
      // ignore
    }
  }
  return result;
}
