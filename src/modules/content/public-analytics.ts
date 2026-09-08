import "server-only";

import { getCachedSiteSettings } from "@/modules/content/cached-site-settings";
import { DEFAULT_ANALYTICS_SETTINGS } from "@/modules/content/content.schemas";
import {
  resolvePublicAnalytics,
  type PublicAnalytics,
} from "@/modules/content/resolve-public-analytics";

export type { PublicAnalytics };

/** Metrika + Direct verification for the public layout (DB first, env fallback). */
export async function getPublicAnalytics(): Promise<PublicAnalytics> {
  const settings = await getCachedSiteSettings();
  return resolvePublicAnalytics(
    settings?.analytics ?? DEFAULT_ANALYTICS_SETTINGS,
    process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID,
  );
}
