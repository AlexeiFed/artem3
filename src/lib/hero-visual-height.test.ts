import { describe, expect, it } from "vitest";

import {
  heroChromeGutter,
  HERO_CHROME_GUTTER_DEFAULT,
  HERO_CHROME_GUTTER_SAFE,
  readHeroVisualHeight,
} from "./hero-visual-height";

describe("readHeroVisualHeight", () => {
  it("uses the visual viewport when it is shorter than svh overlay chrome", () => {
    expect(readHeroVisualHeight(788.4, 844)).toBe(788);
  });

  it("keeps svh when Safari reports a larger visual viewport on first load", () => {
    expect(readHeroVisualHeight(920, 844)).toBe(844);
  });

  it("falls back to the visual viewport when svh cannot be measured", () => {
    expect(readHeroVisualHeight(700.4, 0)).toBe(700);
  });
});

describe("heroChromeGutter", () => {
  const chromeUa =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36";
  const yandexUa =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Mobile Safari/537.36";

  it("keeps the plate near the bottom in stock Chrome", () => {
    expect(
      heroChromeGutter({
        userAgent: chromeUa,
        visualHeight: 844,
        layoutHeight: 844,
      }),
    ).toBe(HERO_CHROME_GUTTER_DEFAULT);
  });

  it("lifts the plate for Yandex overlay chrome", () => {
    expect(
      heroChromeGutter({
        userAgent: yandexUa,
        visualHeight: 844,
        layoutHeight: 844,
      }),
    ).toBe(HERO_CHROME_GUTTER_SAFE);
  });

  it("uses the measured overlay when visual viewport is shorter", () => {
    expect(
      heroChromeGutter({
        userAgent: chromeUa,
        visualHeight: 760,
        layoutHeight: 844,
      }),
    ).toBe("108px");
  });
});
