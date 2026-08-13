import { describe, expect, it } from "vitest";

import { ensureHomeNavItem, HOME_NAV_ITEM } from "./ensure-home-nav";

describe("ensureHomeNavItem", () => {
  it("prepends Главная when #main is missing", () => {
    const nav = [
      { label: "Услуги", href: "#uslugi" },
      { label: "Кейсы", href: "#cases" },
    ];

    expect(ensureHomeNavItem(nav)).toEqual([HOME_NAV_ITEM, ...nav]);
  });

  it("keeps existing #main entry without duplicating", () => {
    const nav = [
      { label: "Главная", href: "#main" },
      { label: "Услуги", href: "#uslugi" },
    ];

    expect(ensureHomeNavItem(nav)).toEqual(nav);
  });
});
