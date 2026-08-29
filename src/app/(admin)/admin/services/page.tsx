import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { ServicesEditor } from "@/components/admin/ServicesEditor";

export default async function AdminServicesPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/services");

  let initialItems: Parameters<typeof ServicesEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    initialItems = await new DrizzleContentRepository().listServices();
  } catch {
    loadError = "Не удалось загрузить услуги. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Услуги" currentPath="/admin/services">
      <ServicesEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
