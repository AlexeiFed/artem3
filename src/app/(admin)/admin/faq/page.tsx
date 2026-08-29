import { FaqEditor } from "@/components/admin/FaqEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminFaqPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/faq");

  let initialItems: Parameters<typeof FaqEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    initialItems = await new DrizzleContentRepository().listFaqs();
  } catch {
    loadError = "Не удалось загрузить FAQ. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="FAQ" currentPath="/admin/faq">
      <FaqEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
