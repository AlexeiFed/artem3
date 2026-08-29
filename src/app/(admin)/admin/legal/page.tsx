import { LegalEditor } from "@/components/admin/LegalEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminLegalPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/legal");

  let initialLegal: Record<string, unknown> = {};
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    const settings = await new DrizzleContentRepository().getSiteSettings();
    if (!settings) {
      loadError = "Настройки сайта не найдены.";
    } else {
      initialLegal = settings.legal as Record<string, unknown>;
    }
  } catch {
    loadError = "Не удалось загрузить правовые тексты. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Правовые страницы" currentPath="/admin/legal">
      <LegalEditor initialLegal={initialLegal} loadError={loadError} />
    </AdminPageFrame>
  );
}
