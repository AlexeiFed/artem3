import { WorkflowEditor } from "@/components/admin/WorkflowEditor";
import {
  TrustBannerSettingsSchema,
  WorkflowSettingsSchema,
} from "@/modules/content/content.schemas";
import type {
  TrustBannerSettings,
  WorkflowSettings,
} from "@/modules/content/content.types";
import { normalizeHonestySettings } from "@/modules/content/map-landing-data";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminWorkflowPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/workflow");

  let initialTrustBanner: TrustBannerSettings | null = null;
  let initialWorkflow: WorkflowSettings | null = null;
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    const settings = await new DrizzleContentRepository().getSiteSettings();
    if (!settings) {
      loadError = "Настройки сайта не найдены.";
    } else {
      initialTrustBanner = TrustBannerSettingsSchema.parse(
        normalizeHonestySettings(settings.trustBanner),
      );
      initialWorkflow = WorkflowSettingsSchema.parse(settings.workflow);
    }
  } catch (error) {
    console.error("[admin/workflow] load failed", error);
    loadError =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Не удалось загрузить блок. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Консультация и работа" currentPath="/admin/workflow">
      {initialTrustBanner && initialWorkflow ? (
        <WorkflowEditor
          initialTrustBanner={initialTrustBanner}
          initialWorkflow={initialWorkflow}
          loadError={loadError}
        />
      ) : (
        <p className="font-sans text-sm text-secondary" role="alert">
          {loadError ?? "Нет данных."}
        </p>
      )}
    </AdminPageFrame>
  );
}
