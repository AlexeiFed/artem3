import {
  createListLeadsHandler,
} from "@/modules/leads/admin-leads.http";
import {
  createAdminLeadsService,
  DrizzleAdminLeadsRepository,
} from "@/modules/leads/admin-leads.service";

export async function GET(): Promise<Response> {
  const { requireAdmin } = await import("@/modules/auth/require-admin");
  return createListLeadsHandler({
    requireAdmin,
    service: createAdminLeadsService(new DrizzleAdminLeadsRepository()),
  })();
}
