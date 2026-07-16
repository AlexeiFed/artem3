import { HonestyEditor } from "@/components/admin/HonestyEditor";
import { TrustBannerSettingsSchema } from "@/modules/content/content.schemas";
import type { TrustBannerSettings } from "@/modules/content/content.types";

import { AdminPageFrame } from "../layout";

export default async function AdminHonestyPage() {
  let initialTrustBanner: TrustBannerSettings | null = null;
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
      initialTrustBanner = TrustBannerSettingsSchema.parse(
        settings.trustBanner,
      );
    }
  } catch {
    loadError =
      "Не удалось загрузить блок. Проверьте PostgreSQL и сессию.";
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
