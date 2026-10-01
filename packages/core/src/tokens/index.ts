/**
 * Design tokens, as TypeScript.
 *
 * These mirror the CSS custom properties in `@snt/ui/styles/tokens.css`.
 * The CSS file is the source of truth for the web app; this file exists so a
 * future React Native app can use the same values, and so TS code can read a
 * colour when it needs one (chart fills, status maps).
 *
 * If you change a value here, change it in tokens.css too.
 */

export const colors = {
  /** The v1 brand palette. The header gradient runs blue to green. */
  brandBlue: '#255DAB',
  brandTeal: '#2572A2',
  brandGreen: '#1CB67F',
  brandYellow: '#FFFF8B',

  /** Page background behind cards. */
  bgApp: '#EBF2FF',
  /** Headers, navigation, form fields. */
  bgSurface: '#FFFFFF',
  /** Cards and panels. */
  bgCard: '#FFFFFF',
  /** Muted fills that need more weight than a line. */
  bgSubtle: '#E8E8E8',
  /** Image placeholder fill. */
  placeholder: '#CECECE',

  ink: '#434846',
  inkMuted: '#6B6B6B',
  inkFaint: '#A8A8A8',

  /** Item names: blue for something owned, green for something wanted. */
  ownedInk: '#2572A2',
  wantedInk: '#1F978D',

  line: '#D9D9D9',
  lineSubtle: '#E6E6E6',

  /** Brand blue. Links, selected states, verified sellers, deal counts. */
  accent: '#2572A2',
  accentBold: '#3983B1',
  /** Filter controls: the selected chip and active tab; and the idle ones. */
  controlActive: '#30799E',
  controlIdle: '#74A4C7',
  accentStrong: '#1D5D85',
  accentTint: '#E9F0F9',

  /** Brand green. The primary button. */
  action: '#1F978D',
  actionStrong: '#1A8078',

  /** Green. Confirmed deals, live status, the WANTED label. */
  success: '#1F978D',
  successTint: '#E2F6EE',

  /** A shop's initials mark. */
  shopMark: '#2B2B2B',

  /** Dark surfaces: the dealer console chrome. */
  dark: '#1A1A18',
  darkRaised: '#33322E',
  darkLine: '#34332F',
  onDarkMuted: '#ABA8A2',
  onDarkSubtle: '#C9C6BE',
} as const;

/**
 * Display and body are the same face. The two keys stay separate so the
 * distinction survives if they ever diverge again — callers name the role,
 * not the font. The files ship in `@snt/assets`.
 */
export const fonts = {
  display: "'Poppins', system-ui, sans-serif",
  body: "'Poppins', system-ui, sans-serif",
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  /** Boxes nested inside a card. */
  md: 12,
  lg: 14,
  /** Feed cards and the swap tiles. */
  xl: 18,
  pill: 999,
} as const;

export const space = {
  '2': 2,
  '4': 4,
  '6': 6,
  '8': 8,
  '10': 10,
  '12': 12,
  '14': 14,
  '16': 16,
  '18': 18,
  '20': 20,
  '24': 24,
} as const;

export const sizes = {
  /** Minimum touch target. Never go below this. */
  touch: 44,
  screenHeader: 52,
  bottomNav: 64,
  consoleNav: 62,
  consoleSidebar: 226,
  /** The marketplace content column. */
  columnMax: 672,
} as const;

/**
 * Breakpoints. Mobile-first: every query is `@media (min-width: …)`.
 * There are no max-width queries anywhere in this codebase.
 */
export const breakpoints = {
  /** Large phone / small tablet. */
  sm: 480,
  /** Tablet. */
  md: 768,
  /** Laptop — the dealer console gains its sidebar and table here. */
  lg: 1024,
  /** Desktop. */
  xl: 1280,
} as const;

export type BreakpointName = keyof typeof breakpoints;
