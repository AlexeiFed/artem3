import "server-only";

import { DEFAULT_ANALYTICS_SETTINGS } from "@/modules/content/content.schemas";
import { DrizzleContentRepository } from "@/modules/content/content.repository";
import {
  resolvePublicAnalytics,
  type PublicAnalytics,
} from "@/modules/content/resolve-public-analytics";

export type { PublicAnalytics };

/** Metrika + Direct verification for the public layout (DB first, env fallback). */
export async function getPublicAnalytics(): Promise<PublicAnalytics> {
  try {
    const settings = await new DrizzleContentRepository().getSiteSettings();
    return resolvePublicAnalytics(
      settings?.analytics,
      process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID,
    );
  } catch {
    return resolvePublicAnalytics(
      DEFAULT_ANALYTICS_SETTINGS,
      process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID,
    );
  }
}
