import { z } from "zod";

const shortText = z.string().trim().min(1).max(160);
const mediumText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(2_500);
const publicUrl = z.url().max(2_048);
const localAssetUrl = z.string().regex(/^\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/);
const anchorUrl = z.string().regex(/^#[a-z][a-z0-9-]*$/).max(80);

export const ServiceSlugSchema = z.enum([
  "razvod",
  "alimenty",
  "imushchestvo",
  "deti",
  "zemlya",
  "uslugi",
]);

export const CtaSchema = z.object({
  label: shortText,
  target: z.literal("#contacts"),
});

export const MetaSchema = z.object({
  adminDemoWarning: z.object({
    enabled: z.boolean(),
    message: mediumText,
  }),
});

export const HeaderSchema = z.object({
  logo: z.object({
    text: shortText,
    ariaLabel: shortText,
  }),
  nav: z
    .array(
      z.object({
        label: shortText,
        href: anchorUrl,
      }),
    )
    .min(3)
    .max(8),
  cta: CtaSchema,
});

export const HeroBadgeSchema = z.object({
  label: shortText,
});

export const VkEmbedSchema = z.object({
  url: publicUrl.refine(
    (url) => ["vk.com", "vkvideo.ru", "vk.ru"].includes(new URL(url).hostname),
    "Разрешён только VK Video URL",
  ),
  title: shortText,
});

export const HeroContentSchema = z.object({
  eyebrow: shortText,
  title: z.literal("Развод, алименты и раздел имущества в Хабаровске"),
  subtitle: mediumText,
  badges: z.array(HeroBadgeSchema).length(4),
  cta: CtaSchema,
  disclaimer: mediumText,
  video: z.object({
    fallbackUrl: localAssetUrl,
    posterUrl: localAssetUrl,
    vkEmbed: VkEmbedSchema.optional(),
  }),
});

export const QuickLinkSchema = z.object({
  slug: ServiceSlugSchema,
  label: shortText,
  href: anchorUrl,
});

export const HiddenRisksSchema = z.object({
  eyebrow: shortText,
  title: shortText,
  copy: longText,
  documentLines: z.array(mediumText).min(3).max(8),
  toxicClauses: z
    .array(
      z.object({
        clause: mediumText,
        risk: mediumText,
      }),
    )
    .min(2)
    .max(6),
});

export const HeroSettingsSchema = z.object({
  meta: MetaSchema,
  header: HeaderSchema,
  hero: HeroContentSchema.omit({ video: true }).extend({
    video: z.object({
      fallbackUrl: localAssetUrl,
      posterUrl: localAssetUrl,
    }),
  }),
  quickLinks: z.array(QuickLinkSchema).length(6),
  hiddenRisks: HiddenRisksSchema,
});

export const ConsultationSchema = z.object({
  eyebrow: shortText,
  title: shortText,
  benefits: z.array(mediumText).length(4),
  cta: CtaSchema,
});

export const HonestyBannerSchema = z.object({
  theme: z.literal("Честно о результате"),
  title: shortText,
  copy: longText,
});

export const TrustBannerSettingsSchema = z.object({
  consultation: ConsultationSchema,
  honesty: HonestyBannerSchema,
});

export const WorkflowSettingsSchema = z.object({
  eyebrow: shortText,
  title: shortText,
  bullets: z
    .array(
      z.object({
        title: shortText,
        copy: longText,
      }),
    )
    .length(3),
});

export const ContactsSettingsSchema = z.object({
  eyebrow: shortText,
  header: shortText,
  phone: z.object({
    label: shortText,
    display: shortText,
    href: z.string().regex(/^tel:\+7\d{10}$/),
  }),
  telegram: z.object({
    label: shortText,
    url: publicUrl,
  }),
  whatsapp: z.object({
    label: shortText,
    url: publicUrl,
  }),
  address: mediumText,
  workHours: mediumText,
});

export const MapSettingsSchema = z.object({
  latitude: z.number().min(48).max(49),
  longitude: z.number().min(134).max(136),
  externalUrl: publicUrl,
});

export const RatingSchema = z.object({
  source: z.enum(["Яндекс", "2ГИС"]),
  value: z.number().min(1).max(5),
  reviewCount: z.number().int().min(1).max(100_000),
  externalUrl: publicUrl,
});

export const RatingsSettingsSchema = z.object({
  heading: shortText,
  items: z.array(RatingSchema).length(2),
});

export const LegalSettingsSchema = z.object({
  entityText: mediumText,
  privacyText: longText,
  nonPublicOfferText: mediumText,
  personalDataText: mediumText,
});

export const VkEmbedSettingsSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false) }),
  z.object({
    enabled: z.literal(true),
    embed: VkEmbedSchema,
  }),
]);

export const ServiceSchema = z.object({
  slug: ServiceSlugSchema,
  title: shortText,
  description: longText,
  situations: z.array(mediumText).length(3),
  trustNote: mediumText,
  priceFromKopecks: z.number().int().min(0).max(100_000_000),
  isHighValue: z.boolean(),
});

export const CaseSchema = z.object({
  situation: longText,
  action: longText,
  result: longText,
});

export const FaqSchema = z.object({
  question: mediumText,
  answer: longText,
});

export const ReviewSchema = z.object({
  author: shortText,
  quote: longText,
  imageUrl: publicUrl.nullable(),
  source: shortText,
  sourceUrl: publicUrl,
});

export const CertificateSchema = z.object({
  title: mediumText,
  imageUrl: publicUrl,
  altText: mediumText,
});

export const ContactsSchema = ContactsSettingsSchema.extend({
  map: MapSettingsSchema,
});

export const LandingDataSchema = z.object({
  meta: MetaSchema,
  header: HeaderSchema,
  hero: HeroContentSchema,
  quickLinks: z.array(QuickLinkSchema).length(6),
  hiddenRisks: HiddenRisksSchema,
  services: z.array(ServiceSchema).length(6),
  consultation: ConsultationSchema,
  workflow: WorkflowSettingsSchema,
  honesty: HonestyBannerSchema,
  cases: z.array(CaseSchema).length(4),
  ratings: RatingsSettingsSchema,
  reviews: z.array(ReviewSchema).min(3).max(6),
  certificates: z.array(CertificateSchema).min(2).max(4),
  faqs: z.array(FaqSchema).min(6).max(20),
  contacts: ContactsSchema,
  legal: LegalSettingsSchema,
});

export const PersistedServiceSchema = ServiceSchema.extend({
  id: z.uuid(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PersistedCaseSchema = CaseSchema.extend({
  id: z.uuid(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PersistedFaqSchema = FaqSchema.extend({
  id: z.uuid(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PersistedReviewSchema = ReviewSchema.extend({
  id: z.uuid(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PersistedCertificateSchema = CertificateSchema.extend({
  id: z.uuid(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
