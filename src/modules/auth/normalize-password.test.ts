import { describe, expect, it } from "vitest";

import { LoginInputSchema } from "./auth.schemas";
import { normalizeAdminPassword } from "./normalize-password";

describe("normalizeAdminPassword", () => {
  it("leaves a latin password unchanged", () => {
    expect(normalizeAdminPassword("correct-password")).toBe("correct-password");
  });

  it("maps a password typed on a Russian keyboard to qwerty", () => {
    expect(normalizeAdminPassword("сщккусе-зфыыцщкв")).toBe("correct-password");
  });

  it("nfc-normalizes combining marks so typed and pasted unicode match", () => {
    expect(normalizeAdminPassword("cafe\u0301-password-x")).toBe(
      "café-password-x",
    );
  });
});

describe("LoginInputSchema password", () => {
  it("accepts a Russian-layout equivalent of the stored latin password", () => {
    const parsed = LoginInputSchema.parse({
      email: "admin@example.com",
      password: "сщккусе-зфыыцщкв",
    });

    expect(parsed.password).toBe("correct-password");
  });
});
