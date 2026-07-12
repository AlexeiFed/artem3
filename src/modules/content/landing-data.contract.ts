import { z } from "zod";

import { LandingDataSchema } from "./content.schemas";

export const LANDING_DATA_UNAVAILABLE_MESSAGE =
  "Не удалось загрузить данные страницы. Попробуйте ещё раз позже.";

export const LandingDataSuccessResponseSchema = z.object({
  ok: z.literal(true),
  data: LandingDataSchema,
});

export const LandingDataErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.literal("LANDING_DATA_UNAVAILABLE"),
    message: z.literal(LANDING_DATA_UNAVAILABLE_MESSAGE),
  }),
});

export const LandingDataResponseSchema = z.discriminatedUnion("ok", [
  LandingDataSuccessResponseSchema,
  LandingDataErrorResponseSchema,
]);

export type LandingDataSuccessResponse = z.infer<
  typeof LandingDataSuccessResponseSchema
>;
export type LandingDataErrorResponse = z.infer<
  typeof LandingDataErrorResponseSchema
>;
export type LandingDataResponse = z.infer<typeof LandingDataResponseSchema>;
