import { HeroLandingEditor } from "@/components/admin/HeroLandingEditor";
import { HeroSettingsSchema } from "@/modules/content/content.schemas";
import type { HeroSettings } from "@/modules/content/content.types";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminHeroPage() {
  let initialHero: HeroSettings | null = null;
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
      initialHero = HeroSettingsSchema.parse(settings.hero);
    }
  } catch {
    loadError =
      "Не удалось загрузить hero. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Hero и практика" currentPath="/admin/hero">
      {initialHero ? (
        <HeroLandingEditor initialHero={initialHero} loadError={loadError} />
      ) : (
        <p className="font-sans text-sm text-secondary" role="alert">
          {loadError ?? "Нет данных."}
        </p>
      )}
    </AdminPageFrame>
  );
}
