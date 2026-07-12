import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import type { AdminContentService } from "@/modules/content/admin-content.service";
import {
  createDefaultAdminContentService,
  guardAdminMutation,
  mapAdminContentError,
  okResponse,
  readAdminJsonBody,
} from "@/modules/content/admin-content.http";

interface CaseItemHandlerDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
  service: Pick<AdminContentService, "updateCase" | "deleteCase">;
}

export function createUpdateCaseHandler({
  requireAdmin,
  siteUrl,
  service,
}: CaseItemHandlerDependencies): (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => Promise<Response> {
  return async function handleUpdateCase(request, context) {
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
      const data = await service.updateCase(id, body.value);
      return okResponse(data);
    } catch (error) {
      return mapAdminContentError(error);
    }
  };
}

export function createDeleteCaseHandler({
  requireAdmin,
  siteUrl,
  service,
}: CaseItemHandlerDependencies): (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => Promise<Response> {
  return async function handleDeleteCase(request, context) {
    const blocked = await guardAdminMutation(request, {
      requireAdmin,
      siteUrl,
    });
    if (blocked) {
      return blocked;
    }

    const { id } = await context.params;

    try {
      await service.deleteCase(id);
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

  return createUpdateCaseHandler({
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

  return createDeleteCaseHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service,
  })(request, context);
}
