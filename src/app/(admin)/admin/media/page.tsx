import { MediaLibrary } from "@/components/admin/MediaLibrary";
import type { MediaLibraryItem } from "@/components/admin/MediaLibrary";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminMediaPage() {
  let initialItems: MediaLibraryItem[] = [];
  let loadError: string | null = null;

  try {
    const { requireAdminOrRedirect } = await import(
      "@/modules/auth/require-admin"
    );
    const { DrizzleMediaRepository } = await import(
      "@/modules/media/media.service"
    );
    await requireAdminOrRedirect("/admin/media");
    const rows = await new DrizzleMediaRepository().list();
    initialItems = rows.map((row) => ({
      id: row.id,
      url: row.url,
      altText: row.altText,
      mimeType: row.mimeType,
      size: row.size,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("[admin/media] load failed", error);
    loadError =
      "Не удалось загрузить список медиа. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Медиа" currentPath="/admin/media">
      <MediaLibrary initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
