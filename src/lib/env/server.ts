import "server-only";

import { z } from "zod";

const postgresUrlSchema = z
  .url()
  .refine((value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol), {
    message: "DATABASE_URL must use the postgres or postgresql protocol",
  });

const serverEnvSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  SESSION_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(14),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

type Environment = Record<string, string | undefined>;

export function parseServerEnv(environment: Environment): ServerEnv {
  return serverEnvSchema.parse(environment);
}

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
