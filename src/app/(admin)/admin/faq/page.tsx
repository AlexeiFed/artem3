import { FaqEditor } from "@/components/admin/FaqEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminFaqPage() {
  let initialItems: Parameters<typeof FaqEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { requireAdmin } = await import("@/modules/auth/require-admin");
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    await requireAdmin();
    initialItems = await new DrizzleContentRepository().listFaqs();
  } catch {
    loadError = "Не удалось загрузить FAQ. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="FAQ" currentPath="/admin/faq">
      <FaqEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
