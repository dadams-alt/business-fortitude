// supabase/functions/_shared/imageops.ts
// Post-processes Gemini output to a fixed 1200x630 JPEG at quality 78.
// Cover-resize (smaller dimension fills target) then centre-crop.

import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const TARGET_W = 1200;
const TARGET_H = 630;
const JPEG_QUALITY = 78;

export async function processHero(input: Uint8Array): Promise<Uint8Array> {
  const decoded = await Image.decode(input);
  // Image.decode may yield an Image or a GIF — for our hero pipeline a
  // GIF is unexpected, so coerce. (imagescript types: Image | GIF.)
  const img = decoded instanceof Image ? decoded : (decoded as unknown as Image);

  const scale = Math.max(TARGET_W / img.width, TARGET_H / img.height);
  const scaledW = Math.round(img.width * scale);
  const scaledH = Math.round(img.height * scale);
  const scaled = img.resize(scaledW, scaledH);

  const x = Math.max(0, Math.round((scaledW - TARGET_W) / 2));
  const y = Math.max(0, Math.round((scaledH - TARGET_H) / 2));
  const cropped = scaled.crop(x, y, TARGET_W, TARGET_H);

  return await cropped.encodeJPEG(JPEG_QUALITY);
}
