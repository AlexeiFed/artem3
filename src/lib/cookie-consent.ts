import { LEGAL_TEXT_VERSION } from "@/modules/content/legal-copy";

export const COOKIE_CONSENT_KEY = "artem-cookie-consent";
export const COOKIE_CONSENT_EVENT = "artem-cookie-consent";

function isCurrentConsent(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      parsed.version === LEGAL_TEXT_VERSION
    );
  } catch {
    return false;
  }
}

export function readCookieConsent(): boolean {
  try {
    return isCurrentConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
  } catch {
    return false;
  }
}

export function acceptCookieConsent(): void {
  try {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ version: LEGAL_TEXT_VERSION }),
    );
  } catch {
    // ignore quota / private mode
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function subscribeCookieConsent(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(COOKIE_CONSENT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(COOKIE_CONSENT_EVENT, onStoreChange);
  };
}
