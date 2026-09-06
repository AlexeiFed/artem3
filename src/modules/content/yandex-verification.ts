const TOKEN_PATTERN = "[A-Za-z0-9_-]+";

const YANDEX_META_CONTENT_PATTERN = new RegExp(
  `<meta\\s+(?=[^>]*\\bname\\s*=\\s*["']yandex-verification["'])[^>]*\\bcontent\\s*=\\s*["'](${TOKEN_PATTERN})["'][^>]*>`,
  "iu",
);

const YANDEX_META_CONTENT_BEFORE_NAME_PATTERN = new RegExp(
  `<meta\\s+(?=[^>]*\\bcontent\\s*=\\s*["'](${TOKEN_PATTERN})["'])[^>]*\\bname\\s*=\\s*["']yandex-verification["'][^>]*>`,
  "iu",
);

const VERIFICATION_LINE_PATTERN = new RegExp(
  `Verification:\\s*(${TOKEN_PATTERN})`,
  "iu",
);

const RAW_TOKEN_PATTERN = new RegExp(`^${TOKEN_PATTERN}$`, "u");

/** Pulls the Webmaster/Direct token from a raw value, meta tag, or HTML file. */
export function extractYandexVerificationContent(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const fromNamedMeta =
    trimmed.match(YANDEX_META_CONTENT_PATTERN)?.[1] ??
    trimmed.match(YANDEX_META_CONTENT_BEFORE_NAME_PATTERN)?.[1];
  if (fromNamedMeta) {
    return fromNamedMeta;
  }

  const fromHtmlFile = trimmed.match(VERIFICATION_LINE_PATTERN)?.[1];
  if (fromHtmlFile) {
    return fromHtmlFile;
  }

  return trimmed;
}

export function isYandexVerificationToken(value: string): boolean {
  return RAW_TOKEN_PATTERN.test(value);
}

export function buildYandexVerificationHtmlFile(token: string): string {
  if (!isYandexVerificationToken(token)) {
    throw new Error("Invalid Yandex verification token");
  }

  return `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: ${token}</body>
</html>`;
}
