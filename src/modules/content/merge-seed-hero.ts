import { HeroSettingsSchema } from "./content.schemas";
import type { HeroSettings } from "./content.types";

/**
 * Навигация шапки и быстрые ссылки не редактируются в админке, поэтому их
 * источник истины — сид. Остальные поля hero остаются за админкой.
 */
export function mergeSeedHero(
  stored: unknown,
  seedHero: HeroSettings,
): HeroSettings {
  const parsed = HeroSettingsSchema.safeParse(stored);
  if (!parsed.success) return HeroSettingsSchema.parse(seedHero);

  return HeroSettingsSchema.parse({
    ...parsed.data,
    header: seedHero.header,
    quickLinks: seedHero.quickLinks,
  });
}
