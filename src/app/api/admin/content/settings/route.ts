import type { AdminContentService } from "@/modules/content/admin-content.service";
import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import {
  createDefaultAdminContentService,
  guardAdminMutation,
  mapAdminContentError,
  okResponse,
  readAdminJsonBody,
} from "@/modules/content/admin-content.http";

interface SettingsHandlerDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
  service: Pick<AdminContentService, "updateSettings">;
}

export function createUpdateSettingsHandler({
  requireAdmin,
  siteUrl,
  service,
}: SettingsHandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleUpdateSettings(
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
      const data = await service.updateSettings(body.value);
      return okResponse({
        id: data.id,
        updatedAt: data.updatedAt.toISOString(),
      });
    } catch (error) {
      return mapAdminContentError(error);
    }
  };
}

export async function PATCH(request: Request): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }, service] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
    createDefaultAdminContentService(),
  ]);

  return createUpdateSettingsHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service: {
      updateSettings: async (input) => {
        const data = await service.updateSettings(input);
        const { recordAuditEvent } = await import("@/modules/audit/audit");
        await recordAuditEvent({ action: "admin.settings_update" });
        return data;
      },
    },
  })(request);
}
