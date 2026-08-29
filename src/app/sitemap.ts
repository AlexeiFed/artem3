import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env/public";

const STATIC_PATHS = [
  "/",
  "/privacy",
  "/personal-data",
  "/cookies",
  "/usloviya",
] as const;

/** Sitemap для Яндекс.Вебмастера / Директа. База URL — NEXT_PUBLIC_SITE_URL. */
export default function sitemap(): MetadataRoute.Sitemap {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_ALLOW_INDEXING } = getPublicEnv();

  if (!NEXT_PUBLIC_ALLOW_INDEXING) {
    return [];
  }

  const siteUrl = NEXT_PUBLIC_SITE_URL.replace(/\/$/u, "");
  const lastModified = new Date();

  return STATIC_PATHS.map((path) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
