import "server-only";

import { getServerEnv } from "@/lib/env/server";

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
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatLeadMessage(input),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      console.error({
        event: "telegram_notify_failed",
        category: "external",
        status: response.status,
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
