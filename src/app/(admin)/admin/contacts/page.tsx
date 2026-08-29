import { ContactsEditor } from "@/components/admin/ContactsEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminContactsPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/contacts");

  let initialContacts: Record<string, unknown> = {};
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    const settings = await new DrizzleContentRepository().getSiteSettings();
    if (!settings) {
      loadError = "Настройки сайта не найдены.";
    } else {
      initialContacts = settings.contacts as Record<string, unknown>;
    }
  } catch {
    loadError = "Не удалось загрузить контакты. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Контакты" currentPath="/admin/contacts">
      <ContactsEditor
        initialContacts={initialContacts}
        loadError={loadError}
      />
    </AdminPageFrame>
  );
}
