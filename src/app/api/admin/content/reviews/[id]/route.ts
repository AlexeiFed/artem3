import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import type { AdminContentService } from "@/modules/content/admin-content.service";
import {
  createDefaultAdminContentService,
  guardAdminMutation,
  mapAdminContentError,
  okResponse,
  readAdminJsonBody,
} from "@/modules/content/admin-content.http";

interface HandlerDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
  service: Pick<AdminContentService, "updateReview" | "deleteReview">;
}

export function createUpdateReviewHandler({
  requireAdmin,
  siteUrl,
  service,
}: HandlerDependencies): (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => Promise<Response> {
  return async function handleUpdateReview(request, context) {
    const blocked = await guardAdminMutation(request, {
      requireAdmin,
      siteUrl,
    });
    if (blocked) {
      return blocked;
    }

    const { id } = await context.params;
    const body = await readAdminJsonBody(request);
    if (!body.ok) {
      return body.response;
    }

    try {
      const data = await service.updateReview(id, body.value);
      return okResponse(data);
    } catch (error) {
      return mapAdminContentError(error);
    }
  };
}

export function createDeleteReviewHandler({
  requireAdmin,
  siteUrl,
  service,
}: HandlerDependencies): (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => Promise<Response> {
  return async function handleDeleteReview(request, context) {
    const blocked = await guardAdminMutation(request, {
      requireAdmin,
      siteUrl,
    });
    if (blocked) {
      return blocked;
    }

    const { id } = await context.params;

    try {
      await service.deleteReview(id);
      return okResponse({ id });
    } catch (error) {
      return mapAdminContentError(error);
    }
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }, service] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
    createDefaultAdminContentService(),
  ]);

  return createUpdateReviewHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service,
  })(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }, service] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
    createDefaultAdminContentService(),
  ]);

  return createDeleteReviewHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service,
  })(request, context);
}
