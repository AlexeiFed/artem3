import "server-only";

import { createHmac } from "node:crypto";

import { getDb } from "@/db/client";
import { auditEvents } from "@/db/schema";
import { getServerEnv } from "@/lib/env/server";

export type AuditAction =
  | "admin.login"
  | "admin.logout"
  | "admin.password_change"
  | "admin.leads_export"
  | "admin.settings_update";

export async function recordAuditEvent(input: {
  action: AuditAction;
  actorUserId?: string;
  clientIp?: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  try {
    const env = getServerEnv();
    await getDb()
      .insert(auditEvents)
      .values({
        action: input.action,
        ...(input.actorUserId === undefined
          ? {}
          : { actorUserId: input.actorUserId }),
        ...(input.clientIp === undefined
          ? {}
          : {
              ipHash: createHmac("sha256", env.SESSION_SECRET)
                .update(input.clientIp)
                .digest("hex"),
            }),
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      });
  } catch {
    console.error({
      event: "audit_record_failed",
      category: "persistence",
      action: input.action,
    });
  }
}
