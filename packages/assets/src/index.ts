/**
 * Asset manifest.
 *
 * Plain data so it resolves the same on web and native. Paths are relative to
 * this package's root, which both bundlers can resolve through the package
 * `exports` map.
 */

export const brand = {
  wordmark: 'brand/wordmark.svg',
} as const;

/**
 * Poppins, self-hosted.
 *
 * Subset to latin + latin-ext and converted to woff2 from the upstream
 * OFL release, so nothing is fetched from a third-party CDN at runtime and
 * the files are versioned with the app. Four static weights, no italics —
 * that is everything the type tokens in `@snt/ui` name.
 *
 * The web app loads these through `next/font/local`; a native app loads the
 * same files through Expo's font API. Licence: `fonts/poppins/OFL.txt`.
 */
export const fonts = {
  poppins400: 'fonts/poppins/poppins-400.woff2',
  poppins500: 'fonts/poppins/poppins-500.woff2',
  poppins600: 'fonts/poppins/poppins-600.woff2',
  poppins700: 'fonts/poppins/poppins-700.woff2',
} as const;

/**
 * Listing photographs are never committed here — they live in object storage
 * and arrive as URLs on a listing. Until then the UI draws a grey placeholder
 * box (`ImagePlaceholder` in `@snt/ui`).
 */
export const images = {} as const;

export type BrandAsset = keyof typeof brand;
export type FontAsset = keyof typeof fonts;
