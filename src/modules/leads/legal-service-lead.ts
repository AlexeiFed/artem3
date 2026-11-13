export const CANONICAL_LEGAL_SERVICES = [
  "Расторжение брака",
  "Алименты",
  "Раздел имущества",
  "Споры о детях",
  "Дополнительные услуги",
] as const;

export type CanonicalLegalService = (typeof CANONICAL_LEGAL_SERVICES)[number];

export const LEGAL_SERVICE_STORAGE_KEY = "selected_legal_service";

export const LEGAL_SERVICE_LEAD_SUCCESS_EVENT = "legal_service_lead_success";

const CANONICAL_SET = new Set<string>(CANONICAL_LEGAL_SERVICES);

/** Maps openModal/service title to YTM canonical name; non-top-5 → null. */
export function toCanonicalLegalService(
  serviceName: string | undefined | null,
): CanonicalLegalService | null {
  if (!serviceName) return null;
  if (!CANONICAL_SET.has(serviceName)) return null;
  return serviceName as CanonicalLegalService;
}

/** Best-effort mirror for YTM HTML tags; never throws (Safari private etc.). */
export function rememberSelectedLegalService(
  service: CanonicalLegalService | null,
): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (service === null) {
      sessionStorage.removeItem(LEGAL_SERVICE_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(LEGAL_SERVICE_STORAGE_KEY, service);
  } catch {
    // Storage blocked — ModalProvider state remains source of truth.
  }
}

export function pushLegalServiceLeadSuccess(
  legalService: CanonicalLegalService | null,
): void {
  const dataLayer = window.dataLayer ?? [];
  window.dataLayer = dataLayer;
  dataLayer.push({
    event: LEGAL_SERVICE_LEAD_SUCCESS_EVENT,
    legal_service: legalService,
  });
}
