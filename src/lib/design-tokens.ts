export const designTokens = {
  color: {
    background: "#FAFAF7",
    textPrimary: "#2B2B2B",
    textSecondary: "#4A4741",
    accentSage: "#3B5942",
    accentForest: "#2F4A36",
    error: "#B33A3A",
  },
  motion: {
    easeCinematic: [0.22, 1, 0.36, 1] as const,
    durationFast: 0.24,
    durationBase: 0.56,
    durationSlow: 0.9,
  },
  radius: {
    control: "999px",
    card: "1.5rem",
    panel: "2rem",
  },
  shadow: {
    lift: "0 24px 80px rgb(47 74 54 / 0.12)",
  },
} as const;

export type DesignTokenCssVariables = Readonly<{
  "--token-color-background": string;
  "--token-color-text-primary": string;
  "--token-color-text-secondary": string;
  "--token-color-accent-sage": string;
  "--token-color-accent-forest": string;
  "--token-color-error": string;
  "--token-motion-ease-cinematic": string;
  "--token-motion-duration-fast": string;
  "--token-motion-duration-base": string;
  "--token-motion-duration-slow": string;
  "--token-radius-control": string;
  "--token-radius-card": string;
  "--token-radius-panel": string;
  "--token-shadow-lift": string;
}>;

export const designTokenCssVariables: DesignTokenCssVariables = {
  "--token-color-background": designTokens.color.background,
  "--token-color-text-primary": designTokens.color.textPrimary,
  "--token-color-text-secondary": designTokens.color.textSecondary,
  "--token-color-accent-sage": designTokens.color.accentSage,
  "--token-color-accent-forest": designTokens.color.accentForest,
  "--token-color-error": designTokens.color.error,
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
};

export type DesignTokens = typeof designTokens;
