import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env/public";

/** https://vibespace27.ru/robots.txt */
export default function robots(): MetadataRoute.Robots {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_ALLOW_INDEXING } = getPublicEnv();
  const siteUrl = NEXT_PUBLIC_SITE_URL.replace(/\/$/u, "");

  if (!NEXT_PUBLIC_ALLOW_INDEXING) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
