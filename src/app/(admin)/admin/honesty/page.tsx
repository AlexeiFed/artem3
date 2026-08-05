import { HonestyEditor } from "@/components/admin/HonestyEditor";
import { TrustBannerSettingsSchema } from "@/modules/content/content.schemas";
import type { TrustBannerSettings } from "@/modules/content/content.types";
import { normalizeHonestySettings } from "@/modules/content/map-landing-data";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminHonestyPage() {
  // Вне try/catch: redirect() из UNAUTHORIZED не должен глотаться.
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/honesty");

  let initialTrustBanner: TrustBannerSettings | null = null;
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
    }
  } catch (error) {
    console.error("[admin/honesty] load failed", error);
    loadError =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Не удалось загрузить блок. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Честно о результате" currentPath="/admin/honesty">
      {initialTrustBanner ? (
        <HonestyEditor
          initialTrustBanner={initialTrustBanner}
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
