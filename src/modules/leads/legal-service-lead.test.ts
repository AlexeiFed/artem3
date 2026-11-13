// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CANONICAL_LEGAL_SERVICES,
  LEGAL_SERVICE_LEAD_SUCCESS_EVENT,
  LEGAL_SERVICE_STORAGE_KEY,
  pushLegalServiceLeadSuccess,
  rememberSelectedLegalService,
  toCanonicalLegalService,
} from "./legal-service-lead";

afterEach(() => {
  sessionStorage.clear();
  delete window.dataLayer;
  vi.restoreAllMocks();
});

describe("toCanonicalLegalService", () => {
  it.each([...CANONICAL_LEGAL_SERVICES])(
    "keeps canonical service %s",
    (name) => {
      expect(toCanonicalLegalService(name)).toBe(name);
    },
  );

  it("returns null for general form labels and non-top-5 services", () => {
    expect(toCanonicalLegalService("Шапка сайта")).toBeNull();
    expect(toCanonicalLegalService("FAQ")).toBeNull();
    expect(toCanonicalLegalService("Контакты")).toBeNull();
    expect(toCanonicalLegalService("Главный экран")).toBeNull();
    expect(toCanonicalLegalService("Земельные споры")).toBeNull();
    expect(toCanonicalLegalService(undefined)).toBeNull();
    expect(toCanonicalLegalService(null)).toBeNull();
  });
});

describe("rememberSelectedLegalService", () => {
  it("writes and clears sessionStorage for YTM compatibility", () => {
    rememberSelectedLegalService("Алименты");
    expect(sessionStorage.getItem(LEGAL_SERVICE_STORAGE_KEY)).toBe("Алименты");

    rememberSelectedLegalService(null);
    expect(sessionStorage.getItem(LEGAL_SERVICE_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when sessionStorage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(() => rememberSelectedLegalService("Алименты")).not.toThrow();
    expect(() => rememberSelectedLegalService(null)).not.toThrow();
  });
});

describe("pushLegalServiceLeadSuccess", () => {
  it("pushes exactly one dataLayer event with legal_service key", () => {
    pushLegalServiceLeadSuccess("Раздел имущества");
    pushLegalServiceLeadSuccess(null);

    expect(window.dataLayer).toEqual([
      {
        event: LEGAL_SERVICE_LEAD_SUCCESS_EVENT,
        legal_service: "Раздел имущества",
      },
      {
        event: LEGAL_SERVICE_LEAD_SUCCESS_EVENT,
        legal_service: null,
      },
    ]);
  });
});
