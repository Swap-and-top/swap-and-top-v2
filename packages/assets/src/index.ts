/**
 * Asset manifest.
 *
 * Plain data so it resolves the same on web and native. Paths are relative to
 * this package's root, which both bundlers can resolve through the package
 * `exports` map.
 */

export const brand = {
  /**
   * The logo — hand-and-device mark plus italic wordmark — in white, for the
   * brand gradient. Carried over from the v1 app's header. `@snt/ui` renders
   * the same artwork inline as `<Logo />` so it can take any colour.
   */
  logoWhite: 'brand/logo-white.svg',
  /** The earlier text-only placeholder wordmark. No longer used by the UI. */
  wordmark: 'brand/wordmark.svg',
} as const;

/**
 * Poppins, self-hosted.
 *
 * Subset to latin + latin-ext and converted to woff2 from the upstream
 * OFL release, so nothing is fetched from a third-party CDN at runtime and
 * the files are versioned with the app. Five static weights, no italics —
 * that is everything the type tokens in `@snt/ui` name. 800 is the design's
 * active tab and swap-tile labels.
 *
 * The web app loads these through `next/font/local`; a native app loads the
 * same files through Expo's font API. Licence: `fonts/poppins/OFL.txt`.
 */
export const fonts = {
  poppins400: 'fonts/poppins/poppins-400.woff2',
  poppins500: 'fonts/poppins/poppins-500.woff2',
  poppins600: 'fonts/poppins/poppins-600.woff2',
  poppins700: 'fonts/poppins/poppins-700.woff2',
  poppins800: 'fonts/poppins/poppins-800.woff2',
} as const;

/**
 * Listing photographs are never committed here — they live in object storage
 * and arrive as URLs on a listing. Until then the UI draws a grey placeholder
 * box (`ImagePlaceholder` in `@snt/ui`).
 */
export const images = {} as const;

export type BrandAsset = keyof typeof brand;
export type FontAsset = keyof typeof fonts;
