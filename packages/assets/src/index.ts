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
 * Listing photographs are never committed here — they live in object storage
 * and arrive as URLs on a listing. Until then the UI draws a grey placeholder
 * box (`ImagePlaceholder` in `@snt/ui`).
 */
export const images = {} as const;

export type BrandAsset = keyof typeof brand;
