import { CertificatesEditor } from "@/components/admin/CertificatesEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminCertificatesPage() {
  let initialItems: Parameters<
    typeof CertificatesEditor
  >[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { requireAdminOrRedirect } = await import(
      "@/modules/auth/require-admin"
    );
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    await requireAdminOrRedirect("/admin/certificates");
    initialItems = await new DrizzleContentRepository().listCertificates();
  } catch (error) {
    console.error("[admin/certificates] load failed", error);
    loadError =
      "Не удалось загрузить документы. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Документы" currentPath="/admin/certificates">
      <CertificatesEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
