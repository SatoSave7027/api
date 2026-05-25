export const colors = {
  bg: "#04060a",
  surface: "#0c1117",
  surfaceAlt: "#121922",
  border: "#1a2330",
  text: "#e6fff7",
  textMuted: "rgba(230, 255, 247, 0.6)",
  textFaint: "rgba(230, 255, 247, 0.4)",
  neon: "#39ff88",
  neonSoft: "rgba(57, 255, 136, 0.18)",
  aqua: "#22d3ee",
  aquaSoft: "rgba(34, 211, 238, 0.18)",
  danger: "#fb7185",
  dangerSoft: "rgba(251, 113, 133, 0.18)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  heading: { fontSize: 24, fontWeight: "700" as const, color: colors.text },
  subheading: { fontSize: 18, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  label: { fontSize: 12, color: colors.neon, letterSpacing: 1 },
  muted: { fontSize: 13, color: colors.textMuted },
};
