import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

// Order matters: tokens first, then the reset that uses them, then app styles.
import '@snt/ui/styles/tokens.css';
import '@snt/ui/styles/reset.css';
import './globals.css';

/**
 * One face, four weights: Poppins, served from our own origin.
 *
 * The files live in `@snt/assets` so a future native app loads the same
 * bytes. They are referenced by path rather than by package specifier
 * because `next/font/local` resolves `src` against this file on disk.
 *
 * Nothing is fetched from a font CDN, and `adjustFontFallback` derives a
 * metric-matched Arial fallback from the files themselves, so the line boxes
 * are the right height before Poppins arrives and the swap does not reflow
 * the page. Each weight is ~11 kB and preloaded, so in practice it lands
 * before first paint.
 *
 * Exposed as a CSS variable that `tokens.css` reads — no component ever
 * names a font directly.
 */
const poppins = localFont({
  src: [
    {
      path: '../../../../packages/assets/fonts/poppins/poppins-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../../packages/assets/fonts/poppins/poppins-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../../packages/assets/fonts/poppins/poppins-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../../packages/assets/fonts/poppins/poppins-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Swap & Top',
  description:
    'Find gadgets easily in Zimbabwe — and trade the one you have towards the one you want.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The design assumes a real mobile viewport; do not lock zoom.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
