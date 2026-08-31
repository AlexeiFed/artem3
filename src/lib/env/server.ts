import "server-only";

import { z } from "zod";

const postgresUrlSchema = z
  .url()
  .refine(
    (value) =>
      ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    {
      message: "DATABASE_URL must use the postgres or postgresql protocol",
    },
  );

const optionalNonEmptyStringSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.string().min(1).optional(),
);

const commonServerEnvSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  SESSION_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(14),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(1).max(5).default(1),
  TELEGRAM_BOT_TOKEN: optionalNonEmptyStringSchema,
  TELEGRAM_CHAT_ID: optionalNonEmptyStringSchema,
  /** Живой DC IP Telegram (обход блокировки DNS на Timeweb). */
  TELEGRAM_API_IP: optionalNonEmptyStringSchema,
  /** Список IP через запятую/пробел; приоритетнее одиночного TELEGRAM_API_IP. */
  TELEGRAM_API_IPS: optionalNonEmptyStringSchema,
  /** Полный base URL прокси/Worker, напр. https://xxx.workers.dev */
  TELEGRAM_API_BASE: optionalNonEmptyStringSchema,
  MAX_BOT_TOKEN: optionalNonEmptyStringSchema,
  MAX_CHAT_ID: optionalNonEmptyStringSchema,
  /** Полный base URL прокси к platform-api2.max.ru */
  MAX_API_BASE: optionalNonEmptyStringSchema,
});

const localMediaEnvSchema = commonServerEnvSchema.extend({
  MEDIA_DRIVER: z.literal("local"),
});

const s3MediaEnvSchema = commonServerEnvSchema.extend({
  MEDIA_DRIVER: z.literal("s3"),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
});

const serverEnvSchema = z.discriminatedUnion("MEDIA_DRIVER", [
  localMediaEnvSchema,
  s3MediaEnvSchema,
]);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

type Environment = Record<string, string | undefined>;

export function parseServerEnv(environment: Environment): ServerEnv {
  return serverEnvSchema.parse({
    ...environment,
    MEDIA_DRIVER: environment.MEDIA_DRIVER ?? "local",
  });
}

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
