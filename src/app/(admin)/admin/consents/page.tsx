import { ConsentsPanel } from "@/components/admin/ConsentsPanel";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminConsentsPage() {
  let initialItems: Parameters<typeof ConsentsPanel>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { requireAdmin } = await import("@/modules/auth/require-admin");
    const {
      createAdminLeadsService,
      DrizzleAdminLeadsRepository,
    } = await import("@/modules/leads/admin-leads.service");
    await requireAdmin();
    const items = await createAdminLeadsService(
      new DrizzleAdminLeadsRepository(),
    ).list();
    initialItems = items
      .filter((item) => item.isDataAgreed)
      .map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        serviceName: item.serviceName,
        situation: item.situation,
        isDataAgreed: item.isDataAgreed,
        consentAt: item.consentAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
      }));
  } catch {
    loadError =
      "Не удалось загрузить согласия. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Согласия" currentPath="/admin/consents">
      <ConsentsPanel initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
