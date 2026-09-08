import "server-only";

import { getCachedSiteSettings } from "@/modules/content/cached-site-settings";
import {
  resolvePublicSeo,
  type PublicSeo,
} from "@/modules/content/resolve-public-seo";

export type { PublicSeo };

export async function getPublicSeo(): Promise<PublicSeo> {
  const settings = await getCachedSiteSettings();
  return resolvePublicSeo(settings?.hero);
}
