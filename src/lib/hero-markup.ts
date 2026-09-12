export const HERO_BRASS_CLASS = "text-brass";

const BLOCK_BREAK = /<\/(?:div|p)>/gi;
const BLOCK_OPEN = /<(?:div|p)(?:\s[^>]*)?>/gi;
const LINE_BREAK = /<br\s*\/?>/gi;

function escapeText(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}

function unescapeText(value: string): string {
  return value
    .replace(/&nbsp;/giu, " ")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&amp;/giu, "&");
}

/** Keep only b/i and brass spans. Block breaks become newlines. */
export function sanitizeHeroMarkup(html: string): string {
  const withBreaks = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "")
    .replace(LINE_BREAK, "\n")
    .replace(BLOCK_BREAK, "\n")
    .replace(BLOCK_OPEN, "");

  const tokens = withBreaks.split(/(<\/?(?:b|strong|i|em|span)(?:\s[^>]*)?>)/giu);
  const open: string[] = [];
  let result = "";

  for (const token of tokens) {
    if (!token) continue;
    const openMatch = token.match(/^<(b|strong|i|em|span)(\s[^>]*)?>$/iu);
    const closeMatch = token.match(/^<\/(b|strong|i|em|span)>$/iu);

    if (openMatch) {
      const tag = openMatch[1]?.toLowerCase();
      if (tag === "b" || tag === "strong") {
        open.push("b");
        result += "<b>";
        continue;
      }
      if (tag === "i" || tag === "em") {
        open.push("i");
        result += "<i>";
        continue;
      }
      if (tag === "span" && /\bclass\s*=\s*(['"])([^'"]*)\1/iu.test(token)) {
        const classMatch = token.match(/\bclass\s*=\s*(['"])([^'"]*)\1/iu);
        const classes = classMatch?.[2]?.split(/\s+/u) ?? [];
        if (classes.includes(HERO_BRASS_CLASS)) {
          open.push("span");
          result += `<span class="${HERO_BRASS_CLASS}">`;
          continue;
        }
      }
      open.push("skip");
      continue;
    }

    if (closeMatch) {
      const popped = open.pop();
      if (popped === "b") result += "</b>";
      if (popped === "i") result += "</i>";
      if (popped === "span") result += "</span>";
      continue;
    }

    result += escapeText(unescapeText(token).replace(/<[^>]+>/gu, ""));
  }

  while (open.length > 0) {
    const popped = open.pop();
    if (popped === "b") result += "</b>";
    if (popped === "i") result += "</i>";
    if (popped === "span") result += "</span>";
  }

  return result.replace(/\n{3,}/gu, "\n\n").replace(/^\n+|\n+$/gu, "");
}

export function stripHeroMarkup(html: string): string {
  return unescapeText(
    sanitizeHeroMarkup(html).replace(/<[^>]+>/gu, ""),
  ).replace(/\s+/gu, " ").trim();
}

export function heroMarkupToEditorHtml(html: string): string {
  return sanitizeHeroMarkup(html).replace(/\n/gu, "<br>");
}

/** Two visual lines: keep CMS markup, split after the first sentence. */
export function disclaimerToHtml(html: string): string {
  const sanitized = sanitizeHeroMarkup(html);
  if (sanitized.includes("\n")) {
    return heroMarkupToEditorHtml(sanitized);
  }
  return heroMarkupToEditorHtml(sanitized.replace(/\.\s+/u, ".\n"));
}
