import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const validLocalEnv = {
  DATABASE_URL: "postgresql://app:secret@localhost:5432/artem",
  SESSION_SECRET: "s".repeat(32),
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD: "correct-horse-battery-staple",
  MEDIA_DRIVER: "local" as const,
};

const validS3Env = {
  ...validLocalEnv,
  MEDIA_DRIVER: "s3" as const,
  S3_ENDPOINT: "https://s3.example.com",
  S3_REGION: "ru-central1",
  S3_BUCKET: "artem-media",
  S3_ACCESS_KEY_ID: "access-key",
  S3_SECRET_ACCESS_KEY: "secret-key",
};

describe("server environment", () => {
  it("defaults MEDIA_DRIVER to local without S3 credentials", async () => {
    const { parseServerEnv } = await import("./server");

    expect(
      parseServerEnv({
        DATABASE_URL: validLocalEnv.DATABASE_URL,
        SESSION_SECRET: validLocalEnv.SESSION_SECRET,
        ADMIN_EMAIL: validLocalEnv.ADMIN_EMAIL,
        ADMIN_PASSWORD: validLocalEnv.ADMIN_PASSWORD,
      }),
    ).toEqual({
      ...validLocalEnv,
      TRUSTED_PROXY_HOPS: 1,
    });
  });

  it("parses an s3 media environment", async () => {
    const { parseServerEnv } = await import("./server");

    expect(parseServerEnv(validS3Env)).toEqual({
      ...validS3Env,
      TRUSTED_PROXY_HOPS: 1,
    });
  });

  it("rejects s3 driver without credentials", async () => {
    const { parseServerEnv } = await import("./server");

    expect(() =>
      parseServerEnv({
        ...validLocalEnv,
        MEDIA_DRIVER: "s3",
      }),
    ).toThrow();
  });

  it("coerces trusted proxy hops within the supported range", async () => {
    const { parseServerEnv } = await import("./server");

    expect(
      parseServerEnv({
        ...validLocalEnv,
        TRUSTED_PROXY_HOPS: "3",
      }).TRUSTED_PROXY_HOPS,
    ).toBe(3);
  });

  it.each(["0", "6", "1.5", "invalid"])(
    "rejects invalid trusted proxy hops %s",
    async (TRUSTED_PROXY_HOPS) => {
      const { parseServerEnv } = await import("./server");

      expect(() =>
        parseServerEnv({ ...validLocalEnv, TRUSTED_PROXY_HOPS }),
      ).toThrow();
    },
  );

  it("parses without optional telegram credentials", async () => {
    const { parseServerEnv } = await import("./server");

    expect(parseServerEnv(validLocalEnv)).toEqual({
      ...validLocalEnv,
      TRUSTED_PROXY_HOPS: 1,
    });
  });

  it("parses optional telegram credentials on local and s3 drivers", async () => {
    const { parseServerEnv } = await import("./server");

    expect(
      parseServerEnv({
        ...validLocalEnv,
        TELEGRAM_BOT_TOKEN: "123:ABC",
        TELEGRAM_CHAT_ID: "-1001234567890",
        TELEGRAM_API_IP: "149.154.167.220",
      }),
    ).toEqual({
      ...validLocalEnv,
      TRUSTED_PROXY_HOPS: 1,
      TELEGRAM_BOT_TOKEN: "123:ABC",
      TELEGRAM_CHAT_ID: "-1001234567890",
      TELEGRAM_API_IP: "149.154.167.220",
    });

    expect(
      parseServerEnv({
        ...validS3Env,
        TELEGRAM_BOT_TOKEN: "456:DEF",
        TELEGRAM_CHAT_ID: "-999",
        TELEGRAM_API_BASE: "https://tg.example",
      }),
    ).toEqual({
      ...validS3Env,
      TRUSTED_PROXY_HOPS: 1,
      TELEGRAM_BOT_TOKEN: "456:DEF",
      TELEGRAM_CHAT_ID: "-999",
      TELEGRAM_API_BASE: "https://tg.example",
    });
  });

  it("treats empty telegram env values as absent", async () => {
    const { parseServerEnv } = await import("./server");

    expect(
      parseServerEnv({
        ...validLocalEnv,
        TELEGRAM_BOT_TOKEN: "",
        TELEGRAM_CHAT_ID: "",
        TELEGRAM_API_IP: "",
        TELEGRAM_API_IPS: "",
        TELEGRAM_API_BASE: "",
      }),
    ).toEqual({
      ...validLocalEnv,
      TRUSTED_PROXY_HOPS: 1,
    });
  });

  it("rejects weak credentials", async () => {
    const { parseServerEnv } = await import("./server");

    expect(() =>
      parseServerEnv({
        ...validLocalEnv,
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
      NEXT_PUBLIC_ALLOW_INDEXING: false,
    });
  });

  it("accepts a Yandex Maps API key uuid", async () => {
    const { parsePublicEnv } = await import("./public");

    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NEXT_PUBLIC_YANDEX_MAPS_API_KEY:
          "6e97c31d-b90e-4697-915a-958bace9b546",
      }),
    ).toEqual({
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      NEXT_PUBLIC_YANDEX_MAPS_API_KEY: "6e97c31d-b90e-4697-915a-958bace9b546",
      NEXT_PUBLIC_ALLOW_INDEXING: false,
    });
  });

  it("defaults indexing to blocked and accepts true flag", async () => {
    const { parsePublicEnv } = await import("./public");

    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "https://example.com",
      }).NEXT_PUBLIC_ALLOW_INDEXING,
    ).toBe(false);

    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NEXT_PUBLIC_ALLOW_INDEXING: "true",
      }).NEXT_PUBLIC_ALLOW_INDEXING,
    ).toBe(true);
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
