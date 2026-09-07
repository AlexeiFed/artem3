export const HERO_CHROME_GUTTER_DEFAULT = "1.5rem";
export const HERO_CHROME_GUTTER_SAFE = "11rem";
export const HERO_CHROME_GUTTER_VAR = "--hero-chrome-gutter";
const HERO_CHROME_OVERLAY_THRESHOLD_PX = 40;

export function readHeroVisualHeight(
  visualHeight: number,
  smallViewportHeight: number,
): number {
  const visual = Math.round(visualHeight);
  if (!Number.isFinite(visual) || visual <= 0) {
    const small = Math.round(smallViewportHeight);
    return Number.isFinite(small) && small > 0 ? small : 0;
  }

  const small = Math.round(smallViewportHeight);
  if (!Number.isFinite(small) || small <= 0) return visual;
  return Math.min(visual, small);
}

export function needsHeroOverlayGutter(userAgent: string): boolean {
  return /YaBrowser|YaSearchBrowser|YaApp|Yowser|SamsungBrowser|HuaweiBrowser|MiuiBrowser/i.test(
    userAgent,
  );
}

export function heroChromeGutter({
  userAgent,
  visualHeight,
  layoutHeight,
}: {
  userAgent: string;
  visualHeight: number;
  layoutHeight: number;
}): string {
  const overlay = Math.round(layoutHeight - visualHeight);
  if (Number.isFinite(overlay) && overlay >= HERO_CHROME_OVERLAY_THRESHOLD_PX) {
    return `${overlay + 24}px`;
  }
  if (needsHeroOverlayGutter(userAgent)) return HERO_CHROME_GUTTER_SAFE;
  return HERO_CHROME_GUTTER_DEFAULT;
}
