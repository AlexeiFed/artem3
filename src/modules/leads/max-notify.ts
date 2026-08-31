import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { formatLeadNotifyHtml } from "@/modules/leads/lead-notify-message";
import { maxBotSendMessage } from "@/modules/leads/max-bot-api";
import type { NotifyLeadPayload } from "@/modules/leads/create-lead.service";

export async function notifyLeadMax(input: NotifyLeadPayload): Promise<void> {
  const { MAX_BOT_TOKEN: token, MAX_CHAT_ID: chatId } = getServerEnv();

  if (!token || !chatId) {
    return;
  }

  try {
    const response = await maxBotSendMessage(
      token,
      chatId,
      formatLeadNotifyHtml(input),
    );

    if (!response.ok) {
      console.error({
        event: "max_notify_failed",
        category: "external",
        status: response.status,
        code: response.code,
        description: response.description,
        leadId: input.id,
      });
    }
  } catch (error) {
    console.error({
      event: "max_notify_failed",
      category: "external",
      errorClass: error instanceof Error ? error.name : "UnknownError",
      leadId: input.id,
    });
  }
}
