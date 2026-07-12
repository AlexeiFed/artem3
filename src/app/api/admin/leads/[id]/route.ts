import { createUpdateLeadStatusHandler } from "@/modules/leads/admin-leads.http";
import {
  createAdminLeadsService,
  DrizzleAdminLeadsRepository,
} from "@/modules/leads/admin-leads.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
  ]);

  return createUpdateLeadStatusHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service: createAdminLeadsService(new DrizzleAdminLeadsRepository()),
  })(request, context);
}
