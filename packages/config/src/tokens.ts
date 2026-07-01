/**
 * sobr design tokens — the single source of visual truth shared by every surface.
 *
 * Light-first, calm, nature/growth. Mostly white, with moss green as the primary
 * accent — modern, clean, minimalistic. Slips use a warm terracotta, never an
 * alarm-red: the UI must never feel punitive.
 *
 * Contrast targets (against `background` #FFFFFF): text.primary, text.secondary,
 * and each status color are chosen to clear WCAG AA for their use (body / large text).
 */

export const palette = {
  // Mostly white, with a faint sage-tinted surface for cards/raised layers.
  background: '#FFFFFF',
  surface: '#F5F8F5',
  surfaceRaised: '#EBF2EA',
  surfaceOverlay: '#DFEBDE',
  border: '#E1E8E0',
  borderStrong: '#C7D6C4',

  // Deep charcoal-green text on white, stepping down to muted sage-grey.
  textPrimary: '#16241C',
  textSecondary: '#4A5A4F',
  textMuted: '#7C8E80',
  textInverse: '#F6FAF5',

  // Status colors — calm, never harsh.
  win: '#3E8E5B', // moss green — a good day (also the primary accent)
  winSoft: '#E3F2E4', // moss tint for fills/backgrounds
  slip: '#C0704A', // muted terracotta — a slip, not a failure
  slipSoft: '#F7E9E1', // terracotta tint
  frozen: '#4A7FA6', // dusty blue — streak protected
  frozenSoft: '#E4EEF5', // blue tint

  // Single accent: the same moss green, used sparingly for streaks + highlights.
  accent: '#3E8E5B',
  accentSoft: '#E3F2E4',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/** Semantic aliases — prefer these in UI code over raw palette entries. */
export const colors = {
  bg: palette.background,
  card: palette.surface,
  cardRaised: palette.surfaceRaised,
  overlay: palette.surfaceOverlay,
  border: palette.border,
  borderStrong: palette.borderStrong,

  text: palette.textPrimary,
  textMuted: palette.textSecondary,
  textFaint: palette.textMuted,
  textOnAccent: palette.textInverse,

  win: palette.win,
  winBg: palette.winSoft,
  slip: palette.slip,
  slipBg: palette.slipSoft,
  frozen: palette.frozen,
  frozenBg: palette.frozenSoft,

  accent: palette.accent,
  accentBg: palette.accentSoft,
} as const;

/** Status → color map, used by calendar cells, badges, summary cards. */
export const statusColors = {
  win: { fg: palette.win, bg: palette.winSoft, label: 'Win' },
  slip: { fg: palette.slip, bg: palette.slipSoft, label: 'Slip' },
  freeze: { fg: palette.frozen, bg: palette.frozenSoft, label: 'Frozen' },
} as const;

/** 4px base spacing scale. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

/** Soft, generous corner radii — no sharp boxes. */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  pill: 999,
  full: 9999,
} as const;

/**
 * Type scale. Fraunces (warm serif/display) for headers + big numbers;
 * Manrope (clean grotesk) for UI text. Family names match the loaded font keys.
 */
export const fonts = {
  display: 'Fraunces',
  displayItalic: 'Fraunces-Italic',
  body: 'Manrope',
  bodyMedium: 'Manrope-Medium',
  bodySemibold: 'Manrope-SemiBold',
  bodyBold: 'Manrope-Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
  '5xl': 64,
  display: 80, // the big streak number on the home screen
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.65,
} as const;

/** Soft elevation — diffuse, low-opacity, never harsh drop shadows. */
export const shadows = {
  none: 'none',
  soft: '0 8px 24px rgba(22,36,28,0.08)',
  raised: '0 12px 32px rgba(22,36,28,0.12)',
} as const;

/** Minimum interactive target — accessibility (≥44px). */
export const a11y = {
  minTapTarget: 44,
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
  grow: 900, // tree level-up / growth transitions
} as const;

export const tokens = {
  palette,
  colors,
  statusColors,
  spacing,
  radii,
  fonts,
  fontSizes,
  lineHeights,
  shadows,
  a11y,
  motion,
} as const;

export type Tokens = typeof tokens;
export type StatusKey = keyof typeof statusColors;
