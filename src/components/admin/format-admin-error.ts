import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";
import { OPERATOR_EMAIL } from "@/modules/content/legal-copy";

export class AdminFormError extends Error {
  readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "AdminFormError";
    this.fields = fields;
  }
}

interface FormatAdminApiErrorOptions {
  stripPrefix?: string;
  fieldMap?: Record<string, string>;
  fieldLabels?: Record<string, string>;
}

const FIELD_LABEL_FALLBACKS: Record<string, string> = {
  emailAddress: "Email — адрес",
  emailLabel: "Email — подпись",
  phoneDisplay: "Телефон (отображение)",
  phoneHref: "Телефон (tel:)",
  telegramUrl: "Telegram — ссылка",
  whatsappUrl: "WhatsApp — ссылка",
  maxUrl: "MAX — ссылка",
  responseSla: "Срок ответа",
  hoursNote: "Пометка под часами",
  header: "Заголовок",
  address: "Адрес",
  workHours: "Часы работы",
  eyebrow: "Надзаголовок",
};

export function humanizeValidationMessage(
  path: string,
  message: string,
): string {
  const lowerPath = path.toLowerCase();
  const lowerMessage = message.toLowerCase();

  if (
    lowerPath.includes("email") ||
    lowerMessage.includes("invalid email") ||
    lowerMessage.includes("email address")
  ) {
    return `Укажите корректный email, например ${OPERATOR_EMAIL}`;
  }

  if (
    (lowerPath.includes("phone") && lowerPath.includes("href")) ||
    (lowerMessage.includes("regex") && lowerPath.includes("phone"))
  ) {
    return "Формат: tel:+7 и 10 цифр, например tel:+74212931547";
  }

  if (
    lowerMessage.includes("https") ||
    lowerMessage.includes("внешняя ссылка")
  ) {
    return "Ссылка должна начинаться с https://";
  }

  if (
    lowerMessage.includes("некорректный url") ||
    lowerMessage.includes("invalid url") ||
    lowerMessage.includes("invalid_format")
  ) {
    return "Проверьте ссылку: нужен полный URL с https://";
  }

  if (
    lowerMessage.includes("too small") ||
    lowerMessage.includes("expected string") ||
    lowerMessage.includes("required") ||
    lowerMessage.includes("undefined")
  ) {
    return "Поле обязательно — заполните его";
  }

  if (/[а-яё]/iu.test(message)) {
    return message;
  }

  return "Исправьте значение в этом поле";
}

export function formatAdminApiError(
  payload: unknown,
  options: FormatAdminApiErrorOptions = {},
): AdminFormError {
  const parsed = AdminApiErrorSchema.safeParse(payload);
  if (!parsed.success) {
    return new AdminFormError(
      "Не удалось сохранить. Обновите страницу и попробуйте снова.",
    );
  }

  const apiFields = parsed.data.error.fields ?? {};
  const mapped: Record<string, string[]> = {};
  const summaryParts: string[] = [];

  for (const [rawPath, messages] of Object.entries(apiFields)) {
    let path = rawPath;
    if (options.stripPrefix && path.startsWith(options.stripPrefix)) {
      path = path.slice(options.stripPrefix.length);
    }

    const formField = options.fieldMap?.[path] ?? path;
    const humanized = messages.map((message) =>
      humanizeValidationMessage(path, message),
    );
    mapped[formField] = humanized;

    const label =
      options.fieldLabels?.[formField] ??
      FIELD_LABEL_FALLBACKS[formField] ??
      formField;
    const first = humanized[0];
    if (first) {
      summaryParts.push(`${label}: ${first}`);
    }
  }

  const details =
    summaryParts.length > 0
      ? summaryParts.slice(0, 4).join(" · ")
      : parsed.data.error.message;

  return new AdminFormError(
    `Не удалось сохранить. ${details}`,
    mapped,
  );
}
