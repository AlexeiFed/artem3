import { z } from "zod";

const shortText = z.string().trim().min(1).max(160);
const mediumText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(2_500);
const localAssetUrl = z.string().regex(/^\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/);
const anchorUrl = z.string().regex(/^#[a-z][a-z0-9-]*$/).max(80);
const APPROVED_VK_HOSTS = ["vk.com", "vk.ru", "vkvideo.ru"] as const;

export const PublicHttpsUrlSchema = z
  .string()
  .max(2_048)
  .superRefine((value, context) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") {
        context.addIssue({
          code: "custom",
          message: "Внешняя ссылка должна использовать HTTPS",
        });
      }
    } catch {
      context.addIssue({
        code: "custom",
        message: "Некорректный URL",
      });
    }
  });

export const APPROVED_HERO_SUBTITLE =
  "Помогаю решить семейные и имущественные споры без лишнего стресса и затяжных судов";

const REQUIRED_SERVICE_SLUGS = [
  "razvod",
  "alimenty",
  "imushchestvo",
  "deti",
  "zemlya",
  "uslugi",
] as const;

const REQUIRED_QUICK_LINKS = [
  { slug: "razvod", href: "#razvod" },
  { slug: "alimenty", href: "#alimenty" },
  { slug: "imushchestvo", href: "#imushchestvo" },
  { slug: "deti", href: "#deti" },
  { slug: "zemlya", href: "#zemlya" },
  { slug: "uslugi", href: "#uslugi" },
] as const;

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
  url: PublicHttpsUrlSchema.superRefine((value, context) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return;
    }

    const hostname = url.hostname.toLowerCase();
    const isApprovedHost = APPROVED_VK_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
    if (!isApprovedHost || url.username !== "" || url.password !== "") {
      context.addIssue({
        code: "custom",
        message: "Разрешены только URL одобренных доменов VK без userinfo",
      });
    }
  }),
  title: shortText,
});

export const HeroContentSchema = z.object({
  eyebrow: shortText,
  title: z.literal("Развод, алименты и раздел имущества в Хабаровске"),
  subtitle: z.literal(APPROVED_HERO_SUBTITLE, {
    error: "Подзаголовок должен соответствовать утверждённому тексту",
  }),
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

export const QuickLinksSchema = z
  .array(QuickLinkSchema)
  .length(6, "Должно быть ровно шесть быстрых ссылок")
  .superRefine((links, context) => {
    REQUIRED_QUICK_LINKS.forEach((expected, index) => {
      const link = links[index];
      if (!link) return;

      if (link.slug !== expected.slug) {
        context.addIssue({
          code: "custom",
          path: [index, "slug"],
          message: `Ожидается slug «${expected.slug}» на позиции ${index + 1}`,
        });
      }
      if (link.href !== expected.href) {
        context.addIssue({
          code: "custom",
          path: [index, "href"],
          message: `Для «${expected.slug}» ожидается ссылка «${expected.href}»`,
        });
      }
    });
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
  quickLinks: QuickLinksSchema,
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
    url: PublicHttpsUrlSchema,
  }),
  whatsapp: z.object({
    label: shortText,
    url: PublicHttpsUrlSchema,
  }),
  address: mediumText,
  workHours: mediumText,
});

export const MapSettingsSchema = z.object({
  latitude: z.number().min(48).max(49),
  longitude: z.number().min(134).max(136),
  externalUrl: PublicHttpsUrlSchema,
});

export const RatingSchema = z.object({
  source: z.enum(["Яндекс", "2ГИС"]),
  value: z.number().min(1).max(5),
  reviewCount: z.number().int().min(1).max(100_000),
  externalUrl: PublicHttpsUrlSchema,
});

export const RatingsSettingsSchema = z.object({
  heading: shortText,
  items: z
    .array(RatingSchema)
    .length(2, "Должно быть ровно два рейтинга")
    .superRefine((items, context) => {
      const expectedSources = ["Яндекс", "2ГИС"] as const;
      expectedSources.forEach((expectedSource, index) => {
        const item = items[index];
        if (item && item.source !== expectedSource) {
          context.addIssue({
            code: "custom",
            path: [index, "source"],
            message: `На позиции ${index + 1} ожидается источник «${expectedSource}»`,
          });
        }
      });
    }),
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

export const ServicesSchema = z
  .array(ServiceSchema)
  .length(6, "Должно быть ровно шесть услуг")
  .superRefine((items, context) => {
    REQUIRED_SERVICE_SLUGS.forEach((expectedSlug, index) => {
      const item = items[index];
      if (item && item.slug !== expectedSlug) {
        context.addIssue({
          code: "custom",
          path: [index, "slug"],
          message: `На позиции ${index + 1} ожидается услуга «${expectedSlug}»`,
        });
      }
    });
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
  imageUrl: PublicHttpsUrlSchema.nullable(),
  source: shortText,
  sourceUrl: PublicHttpsUrlSchema,
});

export const CertificateSchema = z.object({
  title: mediumText,
  imageUrl: PublicHttpsUrlSchema,
  altText: mediumText,
});

export const ContactsSchema = ContactsSettingsSchema.extend({
  map: MapSettingsSchema,
});

export const LandingDataSchema = z.object({
  meta: MetaSchema,
  header: HeaderSchema,
  hero: HeroContentSchema,
  quickLinks: QuickLinksSchema,
  hiddenRisks: HiddenRisksSchema,
  services: ServicesSchema,
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
