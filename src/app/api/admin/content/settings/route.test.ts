import { describe, expect, it, vi } from "vitest";

import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";

import { createUpdateSettingsHandler } from "./route";

describe("PATCH /api/admin/content/settings", () => {
  it("rejects mutation without a valid admin", async () => {
    const handler = createUpdateSettingsHandler({
      requireAdmin: async () => {
        throw new AuthDomainError("UNAUTHORIZED");
      },
      siteUrl: "https://example.test",
      service: {
        updateSettings: async () => {
          throw new Error("should not be called");
        },
      },
    });

    const response = await handler(
      new Request("https://example.test/api/admin/content/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://example.test",
        },
        body: JSON.stringify({
          legal: {
            entityText: "ИП Тест",
            privacyText: "Политика",
            cookiesConsentText: "Cookies",
            nonPublicOfferText: "Не оферта",
            personalDataText: "ПДн",
          },
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("rejects cross-origin mutations", async () => {
    const updateSettings = vi.fn();
    const handler = createUpdateSettingsHandler({
      requireAdmin: async () =>
        ({
          id: "11111111-1111-4111-8111-111111111111",
          email: "admin@example.com",
        }) satisfies SafeAdminUser,
      siteUrl: "https://example.test",
      service: { updateSettings },
    });

    const response = await handler(
      new Request("https://example.test/api/admin/content/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://evil.test",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(403);
    expect(updateSettings).not.toHaveBeenCalled();
  });
});
