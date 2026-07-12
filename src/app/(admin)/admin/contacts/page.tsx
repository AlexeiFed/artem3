import { ContactsEditor } from "@/components/admin/ContactsEditor";

import { AdminPageFrame } from "../layout";

export default async function AdminContactsPage() {
  let initialContacts: Record<string, unknown> = {};
  let loadError: string | null = null;

  try {
    const { requireAdmin } = await import("@/modules/auth/require-admin");
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    await requireAdmin();
    const settings = await new DrizzleContentRepository().getSiteSettings();
    if (!settings) {
      loadError = "Настройки сайта не найдены.";
    } else {
      initialContacts = settings.contacts as Record<string, unknown>;
    }
  } catch {
    loadError =
      "Не удалось загрузить контакты. Проверьте PostgreSQL и сессию.";
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
