import { AnalyticsEditor } from "@/components/admin/AnalyticsEditor";
import {
  AnalyticsSettingsSchema,
  DEFAULT_ANALYTICS_SETTINGS,
} from "@/modules/content/content.schemas";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminAnalyticsPage() {
  let initialAnalytics = DEFAULT_ANALYTICS_SETTINGS;
  let loadError: string | null = null;

  try {
    const { requireAdmin } = await import("@/modules/auth/require-admin");
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    await requireAdmin();
    const settings = await new DrizzleContentRepository().getSiteSettings();
    if (!settings) {
      loadError = "Настройки сайта не найдены.";
    } else {
      const parsed = AnalyticsSettingsSchema.safeParse(settings.analytics);
      initialAnalytics = parsed.success
        ? parsed.data
        : DEFAULT_ANALYTICS_SETTINGS;
    }
  } catch {
    loadError =
      "Не удалось загрузить аналитику. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Метрика" currentPath="/admin/analytics">
      <AnalyticsEditor
        initialAnalytics={initialAnalytics}
        loadError={loadError}
      />
    </AdminPageFrame>
  );
}
