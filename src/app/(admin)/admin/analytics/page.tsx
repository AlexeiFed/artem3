import { AnalyticsEditor } from "@/components/admin/AnalyticsEditor";
import {
  AnalyticsSettingsSchema,
  DEFAULT_ANALYTICS_SETTINGS,
} from "@/modules/content/content.schemas";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminAnalyticsPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/analytics");

  let initialAnalytics = DEFAULT_ANALYTICS_SETTINGS;
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
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
    loadError = "Не удалось загрузить аналитику. Проверьте PostgreSQL.";
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
