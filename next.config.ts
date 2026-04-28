import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      // news-images Storage bucket on the linked Supabase project.
      {
        protocol: "https",
        hostname: "lsdjxhqocslefawseotl.supabase.co",
        pathname: "/storage/v1/object/public/news-images/**",
      },
    ],
  },
  async rewrites() {
    return [
      // IndexNow key verification: search engines fetch /<32-hex>.txt.
      // Map that to the dynamic route handler so the key never has to
      // sit in /public.
      {
        source: "/:key([a-f0-9]{32}).txt",
        destination: "/api/indexnow/:key",
      },
    ];
  },
};

export default nextConfig;
