import { z } from "zod";

import { validatePersonName } from "./lead-form.validation";

function trimmedOptional(maximum: number) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => Array.from(value).length <= maximum, {
      message: `Введите не более ${maximum} символов`,
    })
    .transform((value) => value || undefined)
    .optional();
}

export const CreateLeadInputSchema = z.strictObject({
  name: z
    .string()
    .transform((value) => value.trim().replace(/\s+/gu, " "))
    .superRefine((value, context) => {
      const error = validatePersonName(value);
      if (error) {
        context.addIssue({ code: "custom", message: error });
      }
    }),
  phone: z.string().trim().min(1, "Введите телефон"),
  situation: trimmedOptional(2_000),
  service: trimmedOptional(120),
  website: z.string().optional(),
  isDataAgreed: z.literal(true, {
    error: "Подтвердите согласие на обработку персональных данных",
  }),
  isMarketingAgreed: z.boolean().optional().default(false),
});

export const LeadSuccessResponseSchema = z.strictObject({
  ok: z.literal(true),
  data: z.strictObject({ id: z.uuid() }),
});

const FieldErrorsSchema = z.record(z.string(), z.array(z.string()).min(1));

export const LeadValidationErrorResponseSchema = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: z.literal("VALIDATION"),
    message: z.literal("Проверьте заполненные поля."),
    fields: FieldErrorsSchema,
  }),
});

export const LeadRateLimitErrorResponseSchema = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: z.literal("RATE_LIMITED"),
    message: z.literal("Слишком много заявок. Попробуйте позже."),
    retryAfterSeconds: z.number().int().positive(),
  }),
});

export const LeadPersistenceErrorResponseSchema = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: z.literal("PERSISTENCE"),
    message: z.literal(
      "Не удалось отправить заявку. Попробуйте ещё раз позже.",
    ),
  }),
});

export const LeadErrorResponseSchema = z.union([
  LeadValidationErrorResponseSchema,
  LeadRateLimitErrorResponseSchema,
  LeadPersistenceErrorResponseSchema,
]);

export const LeadResponseSchema = z.union([
  LeadSuccessResponseSchema,
  LeadErrorResponseSchema,
]);

export type CreateLeadInput = z.infer<typeof CreateLeadInputSchema>;
export type LeadFieldErrors = z.infer<typeof FieldErrorsSchema>;
