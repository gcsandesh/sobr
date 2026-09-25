/**
 * sobr design tokens — the single source of visual truth shared by every surface.
 *
 * "Organic": cool mist background, deep teal as the single brand accent, forest
 * green for the positive/growth state. Adapted from the Sobr.dc.html prototype's
 * visual language (palette + Fraunces/Figtree type) — the underlying product
 * model (daily win/slip streak, freeze tokens) and non-triggering copy are
 * unchanged; only the look moved. Slips stay a muted, non-alarming clay tone —
 * the UI must never feel punitive.
 *
 * Contrast targets (against `background` #F0F5F3): text.primary, text.secondary,
 * and each status color are chosen to clear WCAG AA for their use (body / large text).
 */

export const palette = {
  // Elevation ladder by LIGHTNESS: the canvas is a cool mist and raised surfaces
  // go *lighter* toward white. Cards must never share the canvas value or the
  // whole screen reads flat and dull.
  background: '#F0F5F3', // canvas — cool mist
  surface: '#FAFDFC', // cards — near-white with a green cast
  surfaceRaised: '#E3EDE9', // sunken: inputs, chips, tab bar
  surfaceOverlay: '#FAFDFC',
  border: '#D5E3DE',
  borderStrong: '#A9C3BB',

  // Cool ink. The greys are green-tinted deliberately — pure neutral greys read
  // dead against a tinted canvas.
  textPrimary: '#16211F',
  textSecondary: '#4A5D59',
  textMuted: '#6F8480',
  textInverse: '#F4FAF8',

  // Status colors — calm, never harsh, but saturated enough to feel alive.
  win: '#457029', // forest green — a good day
  winSoft: '#D9EFBE', // saturated enough that a clear day reads green at a glance
  slip: '#B5544B', // muted brick — a slip, not a failure
  slipSoft: '#FBE7E3',
  // Freeze moved teal → blue: teal is now the brand accent, and a frozen day
  // must never be mistaken for a branded/active one. Ice reads blue anyway.
  frozen: '#3E6FA8',
  frozenSoft: '#E1ECF7',

  // Deep teal accent. `accent` is the text/CTA-safe tone (≈5.5:1 with white);
  // `accentBright` is the luminous tone used only for glows, gradient stops and
  // fills that never carry text.
  accent: '#1F6F6B',
  accentBright: '#2E9D95',
  accentSoft: '#E2F2EF',

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
  accentBright: palette.accentBright,
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
 * Type scale. Fraunces (soft serif, bold + black) for headers + big numbers;
 * Figtree (clean grotesk) for UI text. Family names match the loaded font keys.
 * Only the static instances are loaded, so the SOFT/WONK axes are fixed at their
 * defaults — switch to the variable font if those ever need tuning.
 */
export const fonts = {
  display: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_900Black',
  body: 'Figtree',
  bodyMedium: 'Figtree-Medium',
  bodySemibold: 'Figtree-SemiBold',
  bodyBold: 'Figtree-Bold',
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

/** Soft elevation — diffuse, ink-tinted, never harsh drop shadows. */
export const shadows = {
  none: 'none',
  soft: '0 8px 24px rgba(22,33,31,0.10)',
  raised: '0 12px 32px rgba(22,33,31,0.16)',
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
