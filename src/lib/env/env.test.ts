import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const validServerEnv = {
  DATABASE_URL: "postgresql://app:secret@localhost:5432/artem",
  SESSION_SECRET: "s".repeat(32),
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD: "correct-horse-battery-staple",
  S3_ENDPOINT: "https://s3.example.com",
  S3_REGION: "ru-central1",
  S3_BUCKET: "artem-media",
  S3_ACCESS_KEY_ID: "access-key",
  S3_SECRET_ACCESS_KEY: "secret-key",
};

describe("server environment", () => {
  it("parses a complete environment without reading it at import time", async () => {
    const { parseServerEnv } = await import("./server");

    expect(parseServerEnv(validServerEnv)).toEqual(validServerEnv);
  });

  it("rejects weak credentials", async () => {
    const { parseServerEnv } = await import("./server");

    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        SESSION_SECRET: "short",
        ADMIN_PASSWORD: "short",
      }),
    ).toThrow();
  });
});

describe("public environment", () => {
  it("coerces an optional numeric Metrika id", async () => {
    const { parsePublicEnv } = await import("./public");

    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NEXT_PUBLIC_YANDEX_METRIKA_ID: "12345678",
      }),
    ).toEqual({
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      NEXT_PUBLIC_YANDEX_METRIKA_ID: 12345678,
    });
  });

  it("rejects a non-numeric Metrika id", async () => {
    const { parsePublicEnv } = await import("./public");

    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NEXT_PUBLIC_YANDEX_METRIKA_ID: "not-a-number",
      }),
    ).toThrow();
  });
});
