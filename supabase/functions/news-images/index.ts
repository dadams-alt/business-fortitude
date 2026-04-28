// supabase/functions/news-images/index.ts
// Stage 4 of the news pipeline. Drafts that come out of news-write have
// hero_image_url=NULL — that's our gating signal. For each, ask Haiku
// for an image prompt + alt text, run Gemini, post-process to 1200x630
// JPEG q78, upload to the news-images Storage bucket, write the URL
// back. SVG fallback covers Gemini failures so the chain never stalls.

import { createServiceClient } from '../_shared/supabase-client.ts';
import { isServiceRoleBearer } from '../_shared/auth.ts';
import { callAIJson } from '../_shared/news-ai.ts';
import { generateImage } from '../_shared/gemini.ts';
import { processHero } from '../_shared/imageops.ts';
import { HAIKU_SYSTEM, visualDirectionFor } from './prompts.ts';
import { generateFallbackSvg } from './fallback-svg.ts';
import type {
  ArticleNeedingImage,
  ImageError,
  ImagePromptResponse,
  ImageResult,
} from './types.ts';

const BATCH_SIZE = 3;
const BUCKET = 'news-images';
const TARGET_W = 1200;
const TARGET_H = 630;

type Client = ReturnType<typeof createServiceClient>;

Deno.serve(async (req) => {
  if (!isServiceRoleBearer(req.headers.get('Authorization'))) {
    return json({ error: 'unauthorised' }, 401);
  }

  const client = createServiceClient();

  const { data: rawDrafts, error } = await client
    .from('articles')
    .select('id, title, lead, category')
    .eq('status', 'draft')
    .is('hero_image_url', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) return json({ error: error.message }, 500);
  const drafts = (rawDrafts ?? []) as ArticleNeedingImage[];

  const result: ImageResult = {
    processed: 0,
    generated: 0,
    fallback: 0,
    failed: 0,
    errors: [],
  };

  for (const article of drafts) {
    result.processed++;
    try {
      const stamp = await produceImage(client, article, result.errors);
      if (stamp === 'generated') result.generated++;
      else if (stamp === 'fallback') result.fallback++;
      else result.failed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.failed++;
      result.errors.push({ article_id: article.id, stage: 'unknown', message: msg });
    }
  }

  return json(result, 200);
});


// ---------- per-article workflow ----------

type ProduceStamp = 'generated' | 'fallback' | 'failed';

async function produceImage(
  client: Client,
  article: ArticleNeedingImage,
  errors: ImageError[],
): Promise<ProduceStamp> {
  // 1. Haiku — image prompt + alt text.
  let prompt: ImagePromptResponse;
  try {
    prompt = await callAIJson<ImagePromptResponse>({
      model: 'haiku',
      system: HAIKU_SYSTEM,
      user: buildHaikuUserMessage(article),
      max_tokens: 500,
      temperature: 0.8,
    });
  } catch (err) {
    errors.push({ article_id: article.id, stage: 'prompt', message: (err as Error).message });
    return 'failed';
  }

  if (!prompt.image_prompt || !prompt.alt_text) {
    errors.push({
      article_id: article.id,
      stage: 'prompt',
      message: 'haiku returned empty image_prompt or alt_text',
    });
    return 'failed';
  }

  // 2. Gemini — try image generation, catch into SVG fallback.
  let bytes: Uint8Array;
  let ext: 'jpg' | 'svg';
  let credit: 'AI generated' | 'BF placeholder';

  try {
    const raw = await generateImage({ prompt: prompt.image_prompt, width: TARGET_W, height: TARGET_H });
    try {
      bytes = await processHero(raw);
    } catch (err) {
      errors.push({ article_id: article.id, stage: 'process', message: (err as Error).message });
      bytes = generateFallbackSvg(article.category, article.title);
      ext = 'svg';
      credit = 'BF placeholder';
      return await uploadAndWrite(client, article, prompt, bytes, ext, credit, errors);
    }
    ext = 'jpg';
    credit = 'AI generated';
  } catch (err) {
    errors.push({ article_id: article.id, stage: 'gemini', message: (err as Error).message });
    bytes = generateFallbackSvg(article.category, article.title);
    ext = 'svg';
    credit = 'BF placeholder';
  }

  return await uploadAndWrite(client, article, prompt, bytes, ext, credit, errors);
}

async function uploadAndWrite(
  client: Client,
  article: ArticleNeedingImage,
  prompt: ImagePromptResponse,
  bytes: Uint8Array,
  ext: 'jpg' | 'svg',
  credit: 'AI generated' | 'BF placeholder',
  errors: ImageError[],
): Promise<ProduceStamp> {
  const filename = `${article.category}/${Date.now()}-${article.id}.${ext}`;
  const contentType = ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';

  const upload = await client.storage.from(BUCKET).upload(filename, bytes, {
    contentType,
    upsert: false,
  });
  if (upload.error) {
    errors.push({
      article_id: article.id,
      stage: 'upload',
      message: `upload: ${upload.error.message}`,
    });
    return 'failed';
  }

  const { data: pubData } = client.storage.from(BUCKET).getPublicUrl(filename);
  const publicUrl = pubData.publicUrl;

  const update = await client
    .from('articles')
    .update({
      hero_image_url: publicUrl,
      hero_image_alt: prompt.alt_text.slice(0, 500),
      hero_image_credit: credit,
    })
    .eq('id', article.id);

  if (update.error) {
    errors.push({
      article_id: article.id,
      stage: 'update',
      message: `update: ${update.error.message}`,
    });
    return 'failed';
  }

  return credit === 'AI generated' ? 'generated' : 'fallback';
}

function buildHaikuUserMessage(article: ArticleNeedingImage): string {
  const direction = visualDirectionFor(article.category);
  return `# Article

Title: ${article.title}

Lead:
${article.lead ?? '(no lead)'}

# Category visual direction (${article.category})

${direction}

Produce the image_prompt + alt_text JSON exactly as specified.`;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
