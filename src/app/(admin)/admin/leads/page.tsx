import { LeadsPanel } from "@/components/admin/LeadsPanel";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { LEADS_PAGE_DEFAULT } from "@/modules/leads/admin-leads.service";

export default async function AdminLeadsPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/leads");

  let initialItems: Parameters<typeof LeadsPanel>[0]["initialItems"] = [];
  let initialNextCursor: string | null = null;
  let loadError: string | null = null;

  try {
    const {
      createAdminLeadsService,
      DrizzleAdminLeadsRepository,
    } = await import("@/modules/leads/admin-leads.service");
    const page = await createAdminLeadsService(
      new DrizzleAdminLeadsRepository(),
    ).listPage({ limit: LEADS_PAGE_DEFAULT });
    initialItems = page.items.map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      situation: item.situation,
      serviceName: item.serviceName,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));
    initialNextCursor = page.nextCursor;
  } catch {
    loadError = "Не удалось загрузить заявки. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Заявки" currentPath="/admin/leads">
      <LeadsPanel
        initialItems={initialItems}
        initialNextCursor={initialNextCursor}
        loadError={loadError}
      />
    </AdminPageFrame>
  );
}
