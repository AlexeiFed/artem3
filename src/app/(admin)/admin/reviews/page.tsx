import { ReviewsEditor } from "@/components/admin/ReviewsEditor";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminReviewsPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/reviews");

  let initialItems: Parameters<typeof ReviewsEditor>[0]["initialItems"] = [];
  let loadError: string | null = null;

  try {
    const { DrizzleContentRepository } = await import(
      "@/modules/content/content.repository"
    );
    initialItems = await new DrizzleContentRepository().listReviews();
  } catch {
    loadError = "Не удалось загрузить отзывы. Проверьте PostgreSQL.";
  }

  return (
    <AdminPageFrame title="Отзывы" currentPath="/admin/reviews">
      <ReviewsEditor initialItems={initialItems} loadError={loadError} />
    </AdminPageFrame>
  );
}
