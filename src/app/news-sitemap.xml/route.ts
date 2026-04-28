// src/app/news-sitemap.xml/route.ts
// Google News sitemap — only articles published in the last 48h, per
// Google's guidelines. Cached for an hour at the edge.

import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://business-fortitude.vercel.app";
const PUBLICATION = "Business Fortitude";

export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, published_at")
    .eq("status", "published")
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(1000);

  const items = (articles ?? [])
    .map(
      (a) => `  <url>
    <loc>${BASE_URL}/article/${escapeXml(a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.published_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
