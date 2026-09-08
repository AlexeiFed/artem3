import { SeoSettingsSchema } from "./content.schemas";
import { SITE_DESCRIPTION, SITE_TITLE } from "./site-metadata";

export type PublicSeo = {
  title: string;
  description: string;
};

const DEFAULT_PUBLIC_SEO: PublicSeo = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

export function resolvePublicSeo(heroFromDb: unknown): PublicSeo {
  if (!heroFromDb || typeof heroFromDb !== "object") {
    return DEFAULT_PUBLIC_SEO;
  }

  const seo = Reflect.get(heroFromDb, "seo");
  const parsed = SeoSettingsSchema.safeParse(seo);
  return parsed.success ? parsed.data : DEFAULT_PUBLIC_SEO;
}
