import { SeoSettingsSchema } from "./content.schemas";
import {
  OG_DESCRIPTION,
  OG_SITE_NAME,
  OG_TITLE,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "./site-metadata";

export type PublicSeo = {
  title: string;
  description: string;
  ogSiteName: string;
  ogTitle: string;
  ogDescription: string;
};

const DEFAULT_PUBLIC_SEO: PublicSeo = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  ogSiteName: OG_SITE_NAME,
  ogTitle: OG_TITLE,
  ogDescription: OG_DESCRIPTION,
};

export function resolvePublicSeo(heroFromDb: unknown): PublicSeo {
  if (!heroFromDb || typeof heroFromDb !== "object") {
    return DEFAULT_PUBLIC_SEO;
  }

  const seo = Reflect.get(heroFromDb, "seo");
  const parsed = SeoSettingsSchema.safeParse(seo);
  return parsed.success ? parsed.data : DEFAULT_PUBLIC_SEO;
}
