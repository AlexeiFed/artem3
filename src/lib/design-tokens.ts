export const designTokens = {
  color: {
    background: "#FAFAF7",
    textPrimary: "#2B2B2B",
    textSecondary: "#4A4741",
    accentSage: "#3B5942",
    accentForest: "#2F4A36",
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

export type DesignTokens = typeof designTokens;
