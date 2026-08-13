import { z } from "zod";

const optionalMetrikaIdSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const optionalMapsApiKeySchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.string().uuid().optional(),
);

/** `true` / `1` → allow indexing; unset / anything else → blocked (staging-safe default). */
const allowIndexingSchema = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
}, z.boolean());

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_YANDEX_METRIKA_ID: optionalMetrikaIdSchema,
  NEXT_PUBLIC_YANDEX_MAPS_API_KEY: optionalMapsApiKeySchema,
  NEXT_PUBLIC_ALLOW_INDEXING: allowIndexingSchema,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

type PublicEnvironment = {
  NEXT_PUBLIC_SITE_URL: string | undefined;
  NEXT_PUBLIC_YANDEX_METRIKA_ID?: string;
  NEXT_PUBLIC_YANDEX_MAPS_API_KEY?: string;
  NEXT_PUBLIC_ALLOW_INDEXING?: string;
};

export function parsePublicEnv(environment: PublicEnvironment): PublicEnv {
  return publicEnvSchema.parse(environment);
}

let cachedPublicEnv: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  cachedPublicEnv ??= parsePublicEnv({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID === undefined
      ? {}
      : {
          NEXT_PUBLIC_YANDEX_METRIKA_ID:
            process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID,
        }),
    ...(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY === undefined
      ? {}
      : {
          NEXT_PUBLIC_YANDEX_MAPS_API_KEY:
            process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY,
        }),
    ...(process.env.NEXT_PUBLIC_ALLOW_INDEXING === undefined
      ? {}
      : {
          NEXT_PUBLIC_ALLOW_INDEXING: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
        }),
  });
  return cachedPublicEnv;
}
