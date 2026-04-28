// src/app/api/revalidate/route.ts
// Bearer-auth POST endpoint that the news-publish edge function calls
// to trigger ISR revalidation. Runs on the Vercel runtime, reads the
// shared secret from process.env.VERCEL_REVALIDATE_TOKEN at request time.

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface Body {
  paths?: unknown;
}

export async function POST(req: NextRequest) {
  const expected = process.env.VERCEL_REVALIDATE_TOKEN;
  const auth = req.headers.get('authorization');
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!Array.isArray(body.paths) || body.paths.length === 0) {
    return NextResponse.json({ error: 'paths array required' }, { status: 400 });
  }

  const revalidated: string[] = [];
  for (const p of body.paths) {
    if (typeof p === 'string' && p.startsWith('/')) {
      revalidatePath(p);
      revalidated.push(p);
    }
  }

  return NextResponse.json({ revalidated });
}
