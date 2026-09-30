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
  bgApp: '#F7F8F9',
  /** Headers, navigation, form fields. */
  bgSurface: '#FFFFFF',
  /** Cards and panels. */
  bgCard: '#EEF1F3',
  /** A tappable card under the pointer. */
  bgCardHover: '#E8ECEF',
  /** Muted fills that need more weight than a line. */
  bgSubtle: '#E8ECEF',
  /** Image placeholder fill. */
  placeholder: '#D5DCE1',
  /** An individual's sale or swap card. */
  bgCardPerson: '#EBF2FF',
  /** An individual's Wanted card. */
  bgCardWanted: '#E4F0F1',

  ink: '#263640',
  inkMuted: '#5D676E',
  inkPlaceholder: '#89939A',
  inkIcon: '#52616B',
  inkFaint: '#A3ACB1',

  /** Item names: blue for something owned, green for something wanted. */
  ownedInk: '#255DAB',
  wantedInk: '#12875C',

  line: '#D5DCE1',
  lineSubtle: '#E0E5E8',
  lineStrong: '#C8D1D6',

  /** Verified sellers and confirmed deals: text, and the tick's disc. */
  trust: '#9A5B00',
  trustFill: '#C77700',
  /** Count badges. */
  alert: '#FF5C5C',

  /** Brand blue. Links, selected states, verified sellers, deal counts. */
  accent: '#255DAB',
  accentStrong: '#1D4B8A',
  accentTint: '#E9F0F9',

  /** Brand green. The primary button. */
  action: '#1CB67F',
  actionStrong: '#179A6B',

  /** Green. Confirmed deals, live status, the WANTED label. */
  success: '#1CB67F',
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
