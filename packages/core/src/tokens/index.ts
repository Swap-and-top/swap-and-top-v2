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
  /** Page background behind cards. */
  bgApp: '#F6F5F3',
  /** Cards, headers, navigation. */
  bgSurface: '#FFFFFF',
  /** Muted fills and dividers that need more weight than a line. */
  bgSubtle: '#ECEAE5',
  /** Image placeholder fill. */
  placeholder: '#E8E6E1',
  /** Image placeholder on a tinted background. */
  placeholderStrong: '#E1DBD4',

  ink: '#1A1A18',
  inkMuted: '#5C5C57',
  inkFaint: '#7A786F',

  line: '#DCDAD5',
  lineSubtle: '#ECEAE5',

  /** Clay. Primary actions, the swap mechanic, verified dealer. */
  accent: '#A8482A',
  accentStrong: '#8A3A1F',
  accentTint: '#F7EBE5',
  accentBorder: '#C99B84',

  /** Green. Confirmed deals and live status. Differs from accent in lightness. */
  success: '#1F5133',
  successTint: '#E3EFE6',

  /** Dark surfaces: the dealer console chrome. */
  dark: '#1A1A18',
  darkRaised: '#33322E',
  darkLine: '#34332F',
  onDarkMuted: '#ABA8A2',
  onDarkSubtle: '#C9C6BE',
} as const;

export const fonts = {
  display: "'Space Grotesk', 'Helvetica Neue', sans-serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
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
  appHeader: 54,
  screenHeader: 48,
  bottomNav: 64,
  consoleNav: 62,
  consoleSidebar: 226,
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
