import { LegalEditor } from "@/components/admin/LegalEditor";

import { AdminPageFrame } from "../layout";

export default async function AdminLegalPage() {
  let initialLegal: Record<string, unknown> = {};
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
      initialLegal = settings.legal as Record<string, unknown>;
    }
  } catch {
    loadError =
      "Не удалось загрузить правовые тексты. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Правовые страницы" currentPath="/admin/legal">
      <LegalEditor initialLegal={initialLegal} loadError={loadError} />
    </AdminPageFrame>
  );
}
