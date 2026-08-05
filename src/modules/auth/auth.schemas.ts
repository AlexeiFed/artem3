import { z } from "zod";

export const LoginInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(14).max(200),
  })
  .strict();

export const ChangePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(14).max(200),
    newPassword: z.string().min(14).max(200),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.currentPassword === value.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Новый пароль должен отличаться от текущего",
      });
    }
  });

export const SafeAdminUserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
  })
  .strict();

export const AuthenticatedSessionResponseSchema = z
  .object({
    authenticated: z.literal(true),
    user: SafeAdminUserSchema,
  })
  .strict();

export const AuthErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.enum([
          "VALIDATION",
          "FORBIDDEN",
          "PAYLOAD_TOO_LARGE",
          "INVALID_CREDENTIALS",
          "RATE_LIMITED",
          "UNAUTHORIZED",
          "INTERNAL",
        ]),
        message: z.string(),
        fields: z.record(z.string(), z.array(z.string())).optional(),
        retryAfterSeconds: z.number().int().positive().optional(),
        attemptsRemaining: z.number().int().min(0).optional(),
        attemptsLimit: z.number().int().positive().optional(),
        resetsAt: z.string().datetime().optional(),
      })
      .strict(),
  })
  .strict();

export type LoginInput = z.infer<typeof LoginInputSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;
export type SafeAdminUser = z.infer<typeof SafeAdminUserSchema>;
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;
