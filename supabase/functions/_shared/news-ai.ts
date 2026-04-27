// supabase/functions/_shared/news-ai.ts
// Anthropic Messages API wrapper. One retry on 5xx with 1s backoff.
// callAIJson extracts JSON from the response, stripping any code-fence
// wrapping the model occasionally produces, and retries once on
// parse failure with a stricter follow-up prompt.

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VERSION = '2023-06-01';

const MODELS = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const;
export type ModelKey = keyof typeof MODELS;

export interface AIRequest {
  model: ModelKey;
  system: string;
  user: string;
  max_tokens: number;
  temperature?: number;
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

async function postOnce(req: AIRequest, apiKey: string): Promise<Response> {
  const body = {
    model: MODELS[req.model],
    max_tokens: req.max_tokens,
    temperature: req.temperature ?? 0.5,
    system: req.system,
    messages: [{ role: 'user', content: req.user }],
  };
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function callAI(req: AIRequest): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');

  let response: Response;
  try {
    response = await postOnce(req, apiKey);
  } catch (err) {
    // Network error — single retry after 1s.
    await sleep(1000);
    response = await postOnce(req, apiKey);
    void err;
  }

  if (response.status >= 500) {
    await sleep(1000);
    response = await postOnce(req, apiKey);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`anthropic ${response.status}: ${text.slice(0, 400)}`);
  }

  const json = (await response.json()) as AnthropicResponse;
  const text = json.content?.find((b) => b.type === 'text')?.text ?? '';
  if (!text) {
    throw new Error('anthropic: empty content block');
  }
  return text;
}

// Extracts the first JSON object/array from a text blob. Handles:
//   ```json\n{...}\n```          (markdown fences with language tag)
//   ```\n{...}\n```              (markdown fences without language tag)
//   prefix prose then {...}      (claude sometimes adds "Here is the JSON:")
//   plain {...}                  (the happy path)
function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : raw;
  const start = candidate.search(/[\[{]/);
  if (start < 0) return candidate.trim();
  // Walk to the matching closer. Tracks string state so braces inside
  // strings don't break the count.
  let depth = 0;
  let inString = false;
  let escape = false;
  let openChar = candidate[start];
  let closeChar = openChar === '{' ? '}' : ']';
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  // Unbalanced — return what we have, parser will throw a useful error.
  return candidate.slice(start).trim();
}

export async function callAIJson<T>(req: AIRequest): Promise<T> {
  const first = await callAI(req);
  try {
    return JSON.parse(extractJson(first)) as T;
  } catch (parseErr) {
    // Single retry with a stricter prompt appended to the user message.
    const retry = await callAI({
      ...req,
      user: req.user + '\n\nYour previous response was not valid JSON. Reply with ONLY the JSON object, no prose, no markdown fences.',
    });
    try {
      return JSON.parse(extractJson(retry)) as T;
    } catch {
      const head = first.slice(0, 200);
      throw new Error(`anthropic JSON parse failed: ${(parseErr as Error).message}; first 200 chars: ${head}`);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
