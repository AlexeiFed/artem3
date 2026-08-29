import { z } from "zod";

import { DEFAULT_TERMS_TEXT, OPERATOR_EMAIL } from "./legal-copy";

const shortText = z.string().trim().min(1).max(160);
/** Надзаголовок, который можно очистить в админке, чтобы убрать дубль на странице. */
const optionalShortText = z.string().trim().max(160);
const mediumText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(2_500);
const legalPageText = z.string().trim().min(1).max(20_000);
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
  "Нахожу оптимальное решение в семейных и имущественных спорах — через переговоры или в суде. Стоимость работы известна заранее.";

export const ServiceSlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9-]{0,39}$/u, "Slug: латиница, цифры и дефис");

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

export const DEFAULT_HERO_METRICS = [
  { value: "11+", label: "лет практики" },
  { value: "380+", label: "клиентов получили помощь" },
  { value: "0 ₽", label: "скрытых платежей" },
];

export const HeroMetricSchema = z.object({
  value: shortText,
  label: shortText,
});

export const HeroMetricsSchema = z
  .array(HeroMetricSchema)
  .length(3, "Должно быть ровно три показателя hero")
  .default(DEFAULT_HERO_METRICS);

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
  title: shortText,
  subtitle: mediumText,
  badges: z.array(HeroBadgeSchema).length(4),
  metrics: HeroMetricsSchema,
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
  .min(1, "Нужна хотя бы одна быстрая ссылка")
  .max(12);

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

export const DEFAULT_SERVICES_INTRO = {
  eyebrow: "Практика",
  title: "Юридическая помощь без туманных формулировок",
} as const;

export const ServicesIntroSchema = z
  .object({
    eyebrow: shortText,
    title: shortText,
  })
  .default(DEFAULT_SERVICES_INTRO);

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
  servicesIntro: ServicesIntroSchema,
});

export const ConsultationSchema = z.object({
  eyebrow: shortText,
  title: shortText,
  benefits: z.array(mediumText).length(4),
  cta: CtaSchema,
});

export const HonestyItemSchema = z.object({
  title: shortText,
  copy: longText,
});

export const HonestyBannerSchema = z.object({
  theme: optionalShortText,
  title: shortText,
  items: z.array(HonestyItemSchema).length(3),
});

export const TrustBannerSettingsSchema = z.object({
  consultation: ConsultationSchema,
  honesty: HonestyBannerSchema,
});

export const WorkflowSettingsSchema = z.object({
  eyebrow: optionalShortText,
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
    href: z
      .string()
      .regex(/^tel:\+7\d{10}$/, {
        error: "Формат: tel:+7 и 10 цифр, например tel:+74212931547",
      }),
  }),
  telegram: z.object({
    label: shortText,
    url: PublicHttpsUrlSchema,
  }),
  whatsapp: z.object({
    label: shortText,
    url: PublicHttpsUrlSchema,
  }),
  max: z.object({
    label: shortText,
    url: PublicHttpsUrlSchema,
  }),
  email: z.object({
    label: shortText,
    address: z.email({
      error: `Укажите корректный email, например ${OPERATOR_EMAIL}`,
    }),
  }),
  responseSla: mediumText,
  address: mediumText,
  workHours: mediumText,
  /** Под часами в шапке и контактах; пустая строка — скрыть */
  hoursNote: z.string().trim().max(160),
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
  privacyText: legalPageText,
  cookiesConsentText: legalPageText,
  nonPublicOfferText: mediumText,
  personalDataText: legalPageText,
  termsText: legalPageText.default(DEFAULT_TERMS_TEXT),
});

export const VkEmbedSettingsSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false) }),
  z.object({
    enabled: z.literal(true),
    embed: VkEmbedSchema,
  }),
]);

/** Public marketing counters — editable in admin, safe to expose on the page. */
export const AnalyticsSettingsSchema = z.object({
  metrikaCounterId: z
    .string()
    .trim()
    .regex(/^(\d{0,15})$/u, "Номер счётчика — только цифры")
    .default(""),
  /** content=… from Yandex Webmaster / Direct site verification meta */
  yandexVerificationContent: z
    .string()
    .trim()
    .max(128)
    .regex(/^[A-Za-z0-9_-]*$/u, "Только латиница, цифры, _ и -")
    .default(""),
});

export const DEFAULT_ANALYTICS_SETTINGS: z.infer<typeof AnalyticsSettingsSchema> =
  {
    metrikaCounterId: "",
    yandexVerificationContent: "",
  };

export const ServiceSchema = z.object({
  slug: ServiceSlugSchema,
  title: shortText,
  description: longText,
  situations: z.array(mediumText).min(3).max(6),
  trustNote: mediumText,
  priceFromKopecks: z.number().int().min(0).max(100_000_000),
  isHighValue: z.boolean(),
  isHidden: z.boolean().default(false),
  ctaLabel: shortText.default("Получить оценку ситуации"),
  iconUrl: z.union([localAssetUrl, PublicHttpsUrlSchema]).nullable().default(null),
});

export const PublicServiceSchema = ServiceSchema.omit({ isHidden: true });

function assertUniqueServiceSlugs<T extends { slug: string }>(
  items: T[],
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.slug)) {
      context.addIssue({
        code: "custom",
        path: [index, "slug"],
        message: "Slug услуги должен быть уникальным",
      });
    }
    seen.add(item.slug);
  });
}

export const ServicesSchema = z
  .array(ServiceSchema)
  .min(1, "Нужна хотя бы одна услуга")
  .max(12)
  .superRefine(assertUniqueServiceSlugs);

export const PublicServicesSchema = z
  .array(PublicServiceSchema)
  .min(1, "Нужна хотя бы одна услуга")
  .max(12)
  .superRefine(assertUniqueServiceSlugs);

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
  imageUrl: z.union([localAssetUrl, PublicHttpsUrlSchema]),
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
  servicesIntro: ServicesIntroSchema,
  services: PublicServicesSchema,
  consultation: ConsultationSchema,
  workflow: WorkflowSettingsSchema,
  honesty: HonestyBannerSchema,
  cases: z.array(CaseSchema).min(1).max(12),
  ratings: RatingsSettingsSchema,
  reviews: z.array(ReviewSchema).min(3).max(6),
  certificates: z.array(CertificateSchema).min(1).max(4),
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
