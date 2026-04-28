// supabase/functions/_shared/gemini.ts
// Wraps gemini-3-pro-image-preview's generateContent endpoint. Returns
// the raw image bytes (PNG or JPEG depending on what Gemini chose);
// imagescript handles either downstream.
//
// One retry on 5xx with 2s backoff. On final failure throws — caller
// decides whether to fall back to the SVG placeholder.

const ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

export interface GeminiImageRequest {
  prompt: string;
  /** target width in px — used for aspectRatio hint, post-process does exact crop */
  width: number;
  height: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
        // Some sdk versions use snake_case in raw HTTP responses.
        inline_data?: { mime_type?: string; data?: string };
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

function pickAspectRatio(w: number, h: number): string {
  // Gemini accepts a small set of canonical ratios. For our 1200x630 hero
  // the closest is "16:9" (1.78); we crop to exact in post-processing.
  const r = w / h;
  if (Math.abs(r - 16 / 9) < 0.1) return '16:9';
  if (Math.abs(r - 4 / 3) < 0.1) return '4:3';
  if (Math.abs(r - 1) < 0.1) return '1:1';
  if (Math.abs(r - 9 / 16) < 0.1) return '9:16';
  return '16:9';
}

async function postOnce(req: GeminiImageRequest, apiKey: string): Promise<Response> {
  const body = {
    contents: [{ parts: [{ text: req.prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: pickAspectRatio(req.width, req.height),
      },
    },
  };
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function generateImage(req: GeminiImageRequest): Promise<Uint8Array> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  let response: Response;
  try {
    response = await postOnce(req, apiKey);
  } catch (err) {
    await sleep(2000);
    response = await postOnce(req, apiKey);
    void err;
  }

  if (response.status >= 500) {
    await sleep(2000);
    response = await postOnce(req, apiKey);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`gemini ${response.status}: ${text.slice(0, 400)}`);
  }

  const json = (await response.json()) as GeminiResponse;
  if (json.error?.message) throw new Error(`gemini api error: ${json.error.message}`);

  // Walk candidates → parts looking for inline image data. Fall back on
  // snake_case (some routes emit raw proto-style fields).
  for (const cand of json.candidates ?? []) {
    for (const part of cand.content?.parts ?? []) {
      const data = part.inlineData?.data ?? part.inline_data?.data;
      if (data) return base64Decode(data);
    }
    if (cand.finishReason && cand.finishReason !== 'STOP') {
      throw new Error(`gemini finish reason: ${cand.finishReason}`);
    }
  }

  if (json.promptFeedback?.blockReason) {
    throw new Error(`gemini blocked: ${json.promptFeedback.blockReason}`);
  }

  // Surface a snippet of the response so debugging in logs is possible.
  throw new Error(
    `gemini: no image data in response. shape: ${JSON.stringify(json).slice(0, 300)}`,
  );
}

function base64Decode(s: string): Uint8Array {
  // atob is available in Deno; gives us a binary string we walk into bytes.
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
