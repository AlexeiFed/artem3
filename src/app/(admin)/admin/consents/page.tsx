import { ConsentsPanel } from "@/components/admin/ConsentsPanel";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminConsentsPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/consents");

  let initialItems: Parameters<typeof ConsentsPanel>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const {
      createAdminLeadsService,
      DrizzleAdminLeadsRepository,
      LEADS_EXPORT_MAX_ROWS,
      LEADS_PAGE_MAX,
    } = await import("@/modules/leads/admin-leads.service");
    const service = createAdminLeadsService(new DrizzleAdminLeadsRepository());
    const items: Awaited<ReturnType<typeof service.listPage>>["items"] = [];
    let cursor: string | undefined;
    while (items.length < LEADS_EXPORT_MAX_ROWS) {
      const page = await service.listPage(
        cursor === undefined
          ? { limit: LEADS_PAGE_MAX }
          : { limit: LEADS_PAGE_MAX, cursor },
      );
      items.push(...page.items);
      if (page.nextCursor === null) {
        break;
      }
      cursor = page.nextCursor;
    }
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
    loadError = "Не удалось загрузить согласия. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Согласия" currentPath="/admin/consents">
      <ConsentsPanel initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
