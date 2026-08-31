export interface LeadNotifyMessageInput {
  id: string;
  name: string;
  phone: string;
  situation?: string | undefined;
  serviceName?: string | undefined;
}

export function formatLeadNotifyHtml(input: LeadNotifyMessageInput): string {
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
