import { LeadsPanel } from "@/components/admin/LeadsPanel";

import { AdminPageFrame } from "../layout";

export default async function AdminLeadsPage() {
  let initialItems: Parameters<typeof LeadsPanel>[0]["initialItems"] = [];
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
    initialItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      situation: item.situation,
      serviceName: item.serviceName,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));
  } catch {
    loadError =
      "Не удалось загрузить заявки. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Заявки" currentPath="/admin/leads">
      <LeadsPanel initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
