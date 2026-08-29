import { describe, expect, it } from "vitest";

import { seedContent } from "@/db/seed-data";

import { mergeSeedHero } from "./merge-seed-hero";

const seedHero = seedContent.settings.hero;

describe("mergeSeedHero", () => {
  it("takes navigation and quick links from seed", () => {
    const stored = {
      ...seedHero,
      header: {
        ...seedHero.header,
        nav: seedHero.header.nav.map((item) =>
          item.href === "#reviews"
            ? { ...item, label: "Устаревшая подпись" }
            : item,
        ),
      },
      quickLinks: seedHero.quickLinks.map((link, index) =>
        index === 0 ? { ...link, label: "Устаревшая ссылка" } : link,
      ),
    };

    const merged = mergeSeedHero(stored, seedHero);

    expect(merged.header).toEqual(seedHero.header);
    expect(merged.quickLinks).toEqual(seedHero.quickLinks);
  });

  it("keeps fields editable in admin", () => {
    const stored = {
      ...seedHero,
      hero: {
        ...seedHero.hero,
        title: "Заголовок из админки",
        metrics: [
          { value: "11+", label: "лет практики" },
          { value: "200+", label: "дел доведено до результата" },
          { value: "0 ₽", label: "первая консультация" },
        ],
      },
      servicesIntro: { eyebrow: "Практика", title: "Заголовок услуг" },
    };

    const merged = mergeSeedHero(stored, seedHero);

    expect(merged.hero.title).toBe("Заголовок из админки");
    expect(merged.hero.metrics[1]?.label).toBe("дел доведено до результата");
    expect(merged.servicesIntro.title).toBe("Заголовок услуг");
  });

  it("falls back to seed when stored settings are invalid", () => {
    expect(mergeSeedHero({ header: null }, seedHero)).toEqual(
      mergeSeedHero(seedHero, seedHero),
    );
  });
});
