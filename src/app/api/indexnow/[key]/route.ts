// src/app/api/indexnow/[key]/route.ts
// Serves the IndexNow key-verification file. The site claims a key by
// hosting it as plain text at /<key>.txt; we map that URL via a rewrite
// in next.config.ts to this dynamic route. Returns 404 unless the path
// segment exactly matches process.env.INDEXNOW_API_KEY.

import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ key: string }> },
) {
  const { key } = await ctx.params;
  const expected = process.env.INDEXNOW_API_KEY;
  if (!expected || key !== expected) {
    return new Response('Not Found', { status: 404 });
  }
  return new Response(expected, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
