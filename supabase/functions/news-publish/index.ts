// supabase/functions/news-publish/index.ts
// Stage 5 of the news pipeline. Promotes hero-image-ready drafts to
// 'published', flips the linked candidate, then pings IndexNow + ISR
// revalidate. IndexNow / revalidate are best-effort — non-2xx responses
// are logged but do not fail the publish run.

import { createServiceClient } from '../_shared/supabase-client.ts';
import { isServiceRoleBearer } from '../_shared/auth.ts';
import { pingIndexNow } from './indexnow.ts';
import { revalidatePaths } from './revalidate.ts';
import type { PublishableArticle, PublishError, PublishResult } from './types.ts';

const BATCH_SIZE = 5;
const SITE_URL = 'https://business-fortitude.vercel.app';
const HOST = 'business-fortitude.vercel.app';

type Client = ReturnType<typeof createServiceClient>;

Deno.serve(async (req) => {
  if (!isServiceRoleBearer(req.headers.get('Authorization'))) {
    return json({ error: 'unauthorised' }, 401);
  }

  const indexNowKey = Deno.env.get('INDEXNOW_API_KEY') ?? '';
  const revalidateToken = Deno.env.get('VERCEL_REVALIDATE_TOKEN') ?? '';

  const client = createServiceClient();

  const { data: rawDrafts, error } = await client
    .from('articles')
    .select('id, slug, source_candidate_id, category')
    .eq('status', 'draft')
    .not('hero_image_url', 'is', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) return json({ error: error.message }, 500);
  const drafts = (rawDrafts ?? []) as PublishableArticle[];

  const result: PublishResult = {
    published: 0,
    indexnow_ok: 0,
    revalidate_ok: 0,
    errors: [],
  };

  for (const article of drafts) {
    try {
      const flipped = await publishOne(client, article, indexNowKey, revalidateToken, result);
      if (flipped) result.published++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push({ article_id: article.id, stage: 'unknown', message: msg });
    }
  }

  return json(result, 200);
});


async function publishOne(
  client: Client,
  article: PublishableArticle,
  indexNowKey: string,
  revalidateToken: string,
  result: PublishResult,
): Promise<boolean> {
  // Flip status='draft' → 'published' atomically. The status filter on
  // the UPDATE means a concurrent worker that already flipped this row
  // sees zero rows back, and we skip.
  const { data: flipData, error: flipError } = await client
    .from('articles')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', article.id)
    .eq('status', 'draft')
    .select('id, slug')
    .maybeSingle();

  if (flipError) {
    result.errors.push({ article_id: article.id, stage: 'flip', message: flipError.message });
    return false;
  }
  if (!flipData) {
    // Already published by someone else — silent skip.
    return false;
  }

  // Mirror the candidate row state when one is linked. Restricted to
  // 'writing' so we don't trample non-pipeline candidate states.
  if (article.source_candidate_id) {
    const candUpdate = await client
      .from('news_candidates')
      .update({ status: 'published' })
      .eq('id', article.source_candidate_id)
      .eq('status', 'writing');
    if (candUpdate.error) {
      result.errors.push({
        article_id: article.id,
        stage: 'candidate',
        message: `candidate flip: ${candUpdate.error.message}`,
      });
      // Continue — the article is published; candidate-state drift is recoverable.
    }
  }

  const articleUrl = `${SITE_URL}/article/${article.slug}`;

  // IndexNow — best effort.
  if (indexNowKey) {
    try {
      const res = await pingIndexNow(
        { host: HOST, siteUrl: SITE_URL, key: indexNowKey },
        [articleUrl],
      );
      if (res.ok) {
        result.indexnow_ok++;
      } else {
        result.errors.push({
          article_id: article.id,
          stage: 'indexnow',
          message: `indexnow ${res.status}: ${res.body ?? ''}`,
        });
      }
    } catch (err) {
      result.errors.push({
        article_id: article.id,
        stage: 'indexnow',
        message: (err as Error).message,
      });
    }
  } else {
    result.errors.push({
      article_id: article.id,
      stage: 'indexnow',
      message: 'INDEXNOW_API_KEY missing — skipped',
    });
  }

  // Revalidate — best effort.
  if (revalidateToken) {
    try {
      const res = await revalidatePaths(
        { siteUrl: SITE_URL, token: revalidateToken },
        ['/', `/article/${article.slug}`],
      );
      if (res.ok) {
        result.revalidate_ok++;
      } else {
        result.errors.push({
          article_id: article.id,
          stage: 'revalidate',
          message: `revalidate ${res.status}: ${res.body ?? ''}`,
        });
      }
    } catch (err) {
      result.errors.push({
        article_id: article.id,
        stage: 'revalidate',
        message: (err as Error).message,
      });
    }
  } else {
    result.errors.push({
      article_id: article.id,
      stage: 'revalidate',
      message: 'VERCEL_REVALIDATE_TOKEN missing — skipped',
    });
  }

  return true;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
