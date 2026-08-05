import { CasesEditor } from "@/components/admin/CasesEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminCasesPage() {
  let initialItems: Parameters<typeof CasesEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { requireAdmin } = await import("@/modules/auth/require-admin");
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    await requireAdmin();
    initialItems = await new DrizzleContentRepository().listCases();
  } catch {
    loadError =
      "Не удалось загрузить кейсы. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Кейсы" currentPath="/admin/cases">
      <CasesEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
