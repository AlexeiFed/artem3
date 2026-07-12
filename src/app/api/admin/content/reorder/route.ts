import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import {
  AdminContentDomainError,
  type AdminContentService,
} from "@/modules/content/admin-content.service";
import {
  createDefaultAdminContentService,
  guardAdminMutation,
  mapAdminContentError,
  okResponse,
  readAdminJsonBody,
} from "@/modules/content/admin-content.http";

interface ReorderHandlerDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
  service: Pick<AdminContentService, "reorder">;
}

export function createReorderHandler({
  requireAdmin,
  siteUrl,
  service,
}: ReorderHandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleReorder(request: Request): Promise<Response> {
    const blocked = await guardAdminMutation(request, {
      requireAdmin,
      siteUrl,
    });
    if (blocked) {
      return blocked;
    }

    const body = await readAdminJsonBody(request);
    if (!body.ok) {
      return body.response;
    }

    try {
      const payload = body.value;
      if (typeof payload !== "object" || payload === null) {
        throw new AdminContentDomainError("VALIDATION", {
          _form: ["Ожидается объект с entity и orderedIds"],
        });
      }
      const record = payload as Record<string, unknown>;
      const data = await service.reorder(record.entity, record.orderedIds);
      return okResponse({ orderedIds: data });
    } catch (error) {
      return mapAdminContentError(error);
    }
  };
}

export async function POST(request: Request): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }, service] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
    createDefaultAdminContentService(),
  ]);

  return createReorderHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service,
  })(request);
}
