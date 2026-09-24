import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';

// Order matters: tokens first, then the reset that uses them, then app styles.
import '@snt/ui/styles/tokens.css';
import '@snt/ui/styles/reset.css';
import './globals.css';

/**
 * Two faces: a geometric display face for numbers and titles, a humanist sans
 * for everything else. Both are exposed as CSS variables that `tokens.css`
 * reads, so no component ever names a font directly.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
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
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
