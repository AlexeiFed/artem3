import {
  AnalyticsSettingsSchema,
  DEFAULT_ANALYTICS_SETTINGS,
} from "@/modules/content/content.schemas";
import type { AnalyticsSettings } from "@/modules/content/content.types";

export type PublicAnalytics = {
  metrikaId: number | undefined;
  yandexVerificationContent: string;
};

function parseMetrikaId(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

export function resolvePublicAnalytics(
  fromDb: unknown,
  envMetrikaId: string | undefined,
): PublicAnalytics {
  const parsed = AnalyticsSettingsSchema.safeParse(fromDb);
  const analytics: AnalyticsSettings = parsed.success
    ? parsed.data
    : DEFAULT_ANALYTICS_SETTINGS;

  const fromSettings = parseMetrikaId(analytics.metrikaCounterId);
  const fromEnv = parseMetrikaId(envMetrikaId);

  return {
    metrikaId: fromSettings ?? fromEnv,
    yandexVerificationContent: analytics.yandexVerificationContent,
  };
}
