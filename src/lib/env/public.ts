import { z } from "zod";

const optionalMetrikaIdSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const optionalMapsApiKeySchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.string().uuid().optional(),
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_YANDEX_METRIKA_ID: optionalMetrikaIdSchema,
  NEXT_PUBLIC_YANDEX_MAPS_API_KEY: optionalMapsApiKeySchema,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

type PublicEnvironment = {
  NEXT_PUBLIC_SITE_URL: string | undefined;
  NEXT_PUBLIC_YANDEX_METRIKA_ID?: string;
  NEXT_PUBLIC_YANDEX_MAPS_API_KEY?: string;
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
  });
  return cachedPublicEnv;
}
