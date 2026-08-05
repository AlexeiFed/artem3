import { ReviewsEditor } from "@/components/admin/ReviewsEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminReviewsPage() {
  let initialItems: Parameters<typeof ReviewsEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { requireAdmin } = await import("@/modules/auth/require-admin");
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    await requireAdmin();
    initialItems = await new DrizzleContentRepository().listReviews();
  } catch {
    loadError =
      "Не удалось загрузить отзывы. Проверьте PostgreSQL и сессию.";
  }

  return (
    <AdminPageFrame title="Отзывы" currentPath="/admin/reviews">
      <ReviewsEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
