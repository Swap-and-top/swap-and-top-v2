import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { ToastOffset } from '@/components/ToastOffset';
import { SignInHost } from '@snt/ui';
import { PageLoadBar } from '@/components/PageLoadBar';
import { ScrollToTop } from '@/components/ScrollToTop';

// Order matters: tokens first, then the reset that uses them, then app styles.
import '@snt/ui/styles/tokens.css';
import '@snt/ui/styles/reset.css';
import './globals.css';

/**
 * One face, five weights: Poppins, served from our own origin.
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
    {
      path: '../../../../packages/assets/fonts/poppins/poppins-800.woff2',
      weight: '800',
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
    'Find gadgets easily in Zimbabwe, and swap the one you have towards the one you want.',
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
    // The feed's first script marks <html> while it reads the filters from
    // the address, before React loads (see (browse)/page.tsx); React is told
    // that the mark is expected.
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body>
        {/* Each new page opens at its top. */}
        <ScrollToTop />
        {/* A thin bar along the top while a page is on its way. */}
        <PageLoadBar />
        {children}
        {/* The one sign-in sheet, shown whenever a guest tries something that
            needs an account. */}
        <SignInHost />
        {/* Short confirmations — "Saved". Bottom left on a
            desktop; on a phone sonner runs them the full width of the screen,
            at the bottom: just above a bottom bar where there is one, and
            otherwise at the foot (see ToastOffset). Green when the thing
            worked, red when it did not (see globals.css). */}
        <Toaster
          position="bottom-left"
          richColors
          offset={24}
          mobileOffset={{ bottom: 12 }}
          duration={2500}
        />
        <ToastOffset />
      </body>
    </html>
  );
}
