import { AdminPageFrame } from "../layout";
import { ServicesEditor } from "@/components/admin/ServicesEditor";

export default async function AdminServicesPage() {
  let initialItems: Parameters<typeof ServicesEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { requireAdmin } = await import("@/modules/auth/require-admin");
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    await requireAdmin();
    initialItems = await new DrizzleContentRepository().listServices();
  } catch (error) {
    loadError =
      error instanceof Error && error.name === "AuthDomainError"
        ? "Требуется вход."
        : "Не удалось загрузить услуги. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Услуги" currentPath="/admin/services">
      <ServicesEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
