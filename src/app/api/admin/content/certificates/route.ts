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
  service: Pick<AdminContentService, "createCertificate">;
}

export function createCreateCertificateHandler({
  requireAdmin,
  siteUrl,
  service,
}: HandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleCreateCertificate(
    request: Request,
  ): Promise<Response> {
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
      const data = await service.createCertificate(body.value);
      return okResponse(data, 201);
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

  return createCreateCertificateHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service,
  })(request);
}
