import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { telegramBotCall } from "@/modules/leads/telegram-bot-api";

export interface NotifyLeadTelegramInput {
  id: string;
  name: string;
  phone: string;
  situation?: string | undefined;
  serviceName?: string | undefined;
}

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
      text: formatLeadMessage(input),
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

function formatLeadMessage(input: NotifyLeadTelegramInput): string {
  const lines = [
    "<b>Новая заявка</b>",
    `Имя: ${escapeHtml(input.name)}`,
    `Телефон: ${escapeHtml(input.phone)}`,
  ];

  if (input.situation) {
    lines.push(`Ситуация: ${escapeHtml(input.situation)}`);
  }

  if (input.serviceName) {
    lines.push(`Услуга: ${escapeHtml(input.serviceName)}`);
  }

  lines.push(`ID: ${escapeHtml(input.id)}`);

  return lines.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
