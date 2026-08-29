import { CasesEditor } from "@/components/admin/CasesEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminCasesPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/cases");

  let initialItems: Parameters<typeof CasesEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    initialItems = await new DrizzleContentRepository().listCases();
  } catch {
    loadError = "Не удалось загрузить кейсы. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Кейсы" currentPath="/admin/cases">
      <CasesEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
