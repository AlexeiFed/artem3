import { z } from "zod";

import {
  CaseSchema,
  CertificateSchema,
  ContactsSettingsSchema,
  FaqSchema,
  HeroSettingsSchema,
  LegalSettingsSchema,
  MapSettingsSchema,
  RatingsSettingsSchema,
  ReviewSchema,
  ServiceSchema,
  TrustBannerSettingsSchema,
  VkEmbedSettingsSchema,
  WorkflowSettingsSchema,
  AnalyticsSettingsSchema,
} from "./content.schemas";

export const ReorderableEntitySchema = z.enum([
  "cases",
  "faqs",
  "reviews",
  "certificates",
  "services",
]);

export const ReorderInputSchema = z
  .object({
    entity: ReorderableEntitySchema,
    orderedIds: z.array(z.uuid()).min(1).max(50),
  })
  .strict();

export const UpdateSiteSettingsInputSchema = z
  .object({
    hero: HeroSettingsSchema.optional(),
    trustBanner: TrustBannerSettingsSchema.optional(),
    workflow: WorkflowSettingsSchema.optional(),
    contacts: ContactsSettingsSchema.optional(),
    legal: LegalSettingsSchema.optional(),
    map: MapSettingsSchema.optional(),
    ratings: RatingsSettingsSchema.optional(),
    vkEmbed: VkEmbedSettingsSchema.optional(),
    analytics: AnalyticsSettingsSchema.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Укажите хотя бы одно поле настроек",
  });

export const UpdateServiceInputSchema = ServiceSchema.strict();
export const CreateServiceInputSchema = ServiceSchema.strict();
export const CreateCaseInputSchema = CaseSchema.strict();
export const UpdateCaseInputSchema = CaseSchema.strict();
export const CreateFaqInputSchema = FaqSchema.strict();
export const UpdateFaqInputSchema = FaqSchema.strict();
export const CreateReviewInputSchema = ReviewSchema.strict();
export const UpdateReviewInputSchema = ReviewSchema.strict();
export const CreateCertificateInputSchema = CertificateSchema.strict();
export const UpdateCertificateInputSchema = CertificateSchema.strict();

export const AdminApiErrorCodeSchema = z.enum([
  "VALIDATION",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "INTERNAL",
]);

export const AdminApiSuccessSchema = z
  .object({
    ok: z.literal(true),
    data: z.unknown(),
  })
  .strict();

export const AdminApiErrorSchema = z
  .object({
    ok: z.literal(false),
    error: z
      .object({
        code: AdminApiErrorCodeSchema,
        message: z.string(),
        fields: z.record(z.string(), z.array(z.string())).optional(),
      })
      .strict(),
  })
  .strict();

export type ReorderableEntity = z.infer<typeof ReorderableEntitySchema>;
export type UpdateSiteSettingsInput = z.infer<typeof UpdateSiteSettingsInputSchema>;
export type AdminApiErrorCode = z.infer<typeof AdminApiErrorCodeSchema>;
