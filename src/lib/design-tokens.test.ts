import { describe, expect, it } from "vitest";

import { designTokenCssVariables, designTokens } from "./design-tokens";

describe("design token CSS variables", () => {
  it("maps every canonical token to its CSS custom property", () => {
    expect(designTokenCssVariables).toEqual({
      "--token-color-background": designTokens.color.background,
      "--token-color-text-primary": designTokens.color.textPrimary,
      "--token-color-text-secondary": designTokens.color.textSecondary,
      "--token-color-accent-sage": designTokens.color.accentSage,
      "--token-color-accent-forest": designTokens.color.accentForest,
      "--token-motion-ease-cinematic": `cubic-bezier(${designTokens.motion.easeCinematic.join(
        ", ",
      )})`,
      "--token-motion-duration-fast": `${designTokens.motion.durationFast}s`,
      "--token-motion-duration-base": `${designTokens.motion.durationBase}s`,
      "--token-motion-duration-slow": `${designTokens.motion.durationSlow}s`,
      "--token-radius-control": designTokens.radius.control,
      "--token-radius-card": designTokens.radius.card,
      "--token-radius-panel": designTokens.radius.panel,
      "--token-shadow-lift": designTokens.shadow.lift,
    });
  });
});
