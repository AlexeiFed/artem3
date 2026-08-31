import "server-only";

import { getServerEnv } from "@/lib/env/server";
import type { NotifyLeadPayload } from "@/modules/leads/create-lead.service";
import { formatLeadNotifyHtml } from "@/modules/leads/lead-notify-message";
import { telegramBotCall } from "@/modules/leads/telegram-bot-api";

export type NotifyLeadTelegramInput = NotifyLeadPayload;

export async function notifyLeadTelegram(
  input: NotifyLeadTelegramInput,
): Promise<void> {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = getServerEnv();

  if (!token || !chatId) {
    return;
  }

  try {
    const response = await telegramBotCall(token, "sendMessage", {
      chat_id: chatId,
      text: formatLeadNotifyHtml(input),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    if (!response.ok) {
      console.error({
        event: "telegram_notify_failed",
        category: "external",
        status: response.error_code ?? "ok_false",
        description: response.description,
        leadId: input.id,
      });
    }
  } catch (error) {
    console.error({
      event: "telegram_notify_failed",
      category: "external",
      errorClass: error instanceof Error ? error.name : "UnknownError",
      leadId: input.id,
    });
  }
}
