import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { poppins } from './font';
import { ToastOffset } from '@/components/ToastOffset';
import { AskName } from '@/components/AskName';
import { BannedGate } from '@/components/BannedGate';
import { QueryProvider } from '@/lib/query';
import { MessagesPreviewProvider } from '@/components/chat/MessagesPreview';
import { StaffHomeProvider } from '@/components/StaffHomeProvider';
import { LiveListingsLoader } from '@/components/LiveListingsLoader';
import { SessionRestore } from '@/components/SessionRestore';
import { ChatConnection } from '@/components/ChatConnection';
import { SignInToast } from '@/components/SignInToast';
import { VerifyPhoneHost } from '@/components/VerifyPhone';
import { AppToaster, SignInHost } from '@snt/ui';
import { BoneContinuity } from '@/components/BoneContinuity';
import { Clarity } from '@/components/Clarity';
import { PageLoadBar } from '@/components/PageLoadBar';
import { ScrollToTop } from '@/components/ScrollToTop';

// Order matters: tokens first, then the reset that uses them, then app styles.
import '@snt/ui/styles/tokens.css';
import '@snt/ui/styles/reset.css';
import './globals.css';

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

/**
 * Before the first paint: marks <html> as signed in when this browser has an
 * session saved in this browser, and as banned when that account is the
 * one this browser last saw banned, so the header draws the bell and the account circle (or their
 * faded banned look) straight away. SessionRestore and BannedGate keep the
 * marks in step afterwards.
 */
/**
 * Umami counts every visit, with no cookies and no names, for Growth in the
 * Staff console (apps/api/src/umami.ts). Loaded only once both settings are
 * there; until Umami is set up with the final hosting, nothing loads.
 */
const UMAMI_SCRIPT = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const UMAMI_SITE = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

const MARK_SESSION = `try{var h=document.documentElement,u=localStorage.getItem('snt-account');if(u){h.setAttribute('data-signed-in','');if(localStorage.getItem('snt-banned')===u)h.setAttribute('data-banned','')}}catch(e){}`;

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
        <script dangerouslySetInnerHTML={{ __html: MARK_SESSION }} />
        {UMAMI_SCRIPT && UMAMI_SITE && (
          <Script src={UMAMI_SCRIPT} data-website-id={UMAMI_SITE} strategy="afterInteractive" />
        )}
        {/* Recordings and heatmaps, in production only (components/Clarity). */}
        <Clarity />
        {/* Each new page opens at its top. */}
        <ScrollToTop />
        {/* A thin bar along the top while a page is on its way. */}
        <PageLoadBar />
        <BoneContinuity />
        {/* Loading from the API: one cache for everything below (see
            lib/query), the sign in and the live listings included. */}
        <QueryProvider>
          {/* A banned account sees only their ban, and can appeal it. */}
          {/* Where the account menu's staff pill opens the console. */}
          {/* The newest chats, for the header's Messages drop down. */}
          <StaffHomeProvider>
            <MessagesPreviewProvider>
              <BannedGate>{children}</BannedGate>
            </MessagesPreviewProvider>
          </StaffHomeProvider>
          {/* A remembered sign in, back before the first paint. */}
          <SessionRestore />
          {/* Chat's live connection while signed in (lib/chat.ts). */}
          <ChatConnection />
          {/* The live listings from the database, for the search panel and
              anything else without a page to bring them. */}
          <LiveListingsLoader />
          {/* The one sign in sheet, shown whenever a guest tries something
              that needs an account. */}
          <SignInHost />
          {/* The verify phone sheet, when someone without one tries to post
              or make an offer; and a name for anyone who joined by phone. */}
          <VerifyPhoneHost />
          <AskName />
          {/* Short confirmations, "Saved" and the like (see AppToaster). */}
          <AppToaster />
          <SignInToast />
          <ToastOffset />
        </QueryProvider>
      </body>
    </html>
  );
}
