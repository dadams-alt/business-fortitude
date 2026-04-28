// src/app/robots.ts
// Standard robots.txt. Disallows /api/ (revalidate + indexnow handlers
// shouldn't be crawled) and /admin/ (reserved for the future admin UI).

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: "https://business-fortitude.vercel.app/sitemap.xml",
  };
}
