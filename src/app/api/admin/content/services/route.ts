/** Services collection is fixed at six rows; mutations go through `/[id]`. */
export async function GET(): Promise<Response> {
  const { errorResponse } = await import("@/lib/http/api-response");
  return errorResponse(
    405,
    "VALIDATION",
    "Используйте PATCH /api/admin/content/services/[id] для обновления услуги.",
  );
}
