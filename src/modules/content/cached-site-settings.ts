import "server-only";

import { cache } from "react";

import { DrizzleContentRepository } from "@/modules/content/content.repository";

/** One settings read per request for analytics + SEO metadata. */
export const getCachedSiteSettings = cache(async () => {
  try {
    return await new DrizzleContentRepository().getSiteSettings();
  } catch {
    return undefined;
  }
});
