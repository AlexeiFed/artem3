import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env/public";

/** https://vibespace27.ru/robots.txt */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/u, "");

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
