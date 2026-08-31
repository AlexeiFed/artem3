import "server-only";

import type { NotifyLeadPayload } from "@/modules/leads/create-lead.service";
import { notifyLeadMax } from "@/modules/leads/max-notify";
import { notifyLeadTelegram } from "@/modules/leads/telegram-notify";

export async function notifyLead(payload: NotifyLeadPayload): Promise<void> {
  await Promise.allSettled([
    notifyLeadTelegram(payload),
    notifyLeadMax(payload),
  ]);
}
