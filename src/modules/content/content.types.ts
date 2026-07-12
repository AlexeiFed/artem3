import { z } from "zod";

import {
  CaseSchema,
  CertificateSchema,
  ContactsSettingsSchema,
  FaqSchema,
  HeroSettingsSchema,
  LandingDataSchema,
  LegalSettingsSchema,
  MapSettingsSchema,
  RatingsSettingsSchema,
  ReviewSchema,
  ServiceSchema,
  TrustBannerSettingsSchema,
  VkEmbedSettingsSchema,
  WorkflowSettingsSchema,
} from "./content.schemas";

export type LandingData = z.infer<typeof LandingDataSchema>;
export type HeroSettings = z.infer<typeof HeroSettingsSchema>;
export type TrustBannerSettings = z.infer<typeof TrustBannerSettingsSchema>;
export type WorkflowSettings = z.infer<typeof WorkflowSettingsSchema>;
export type ContactsSettings = z.infer<typeof ContactsSettingsSchema>;
export type LegalSettings = z.infer<typeof LegalSettingsSchema>;
export type MapSettings = z.infer<typeof MapSettingsSchema>;
export type RatingsSettings = z.infer<typeof RatingsSettingsSchema>;
export type VkEmbedSettings = z.infer<typeof VkEmbedSettingsSchema>;
export type ServiceContent = z.infer<typeof ServiceSchema>;
export type CaseContent = z.infer<typeof CaseSchema>;
export type FaqContent = z.infer<typeof FaqSchema>;
export type ReviewContent = z.infer<typeof ReviewSchema>;
export type CertificateContent = z.infer<typeof CertificateSchema>;
