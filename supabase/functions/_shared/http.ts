// supabase/functions/_shared/http.ts
// fetch wrapper with a hard timeout via AbortController. Used by
// news-ingest-rss for feed pulls and (later) by news-filter for
// source-URL scrapes. Keeps the UA + timeout policy in one place
// so we can change it project-wide.

export interface FetchOpts {
  ua: string;
  timeoutMs: number;
  /** Optional Accept header. Defaults to a feed-friendly preference list. */
  accept?: string;
}

export async function fetchWithTimeout(url: string, opts: FetchOpts): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        'User-Agent': opts.ua,
        'Accept': opts.accept ?? 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}
