'use client';

/**
 * Sign-in, as far as it exists.
 *
 * `SignInHost` sits once in the app and shows the sign-in sheet whenever
 * something asks for it (see `requireSignIn` in @snt/core), saying why an
 * account is needed there. Signing in brings the visitor back to the page
 * they were on.
 *
 * It offers the ways in — Google, Facebook (neither connected yet) and
 * "Continue with email", which goes to the sign in page and back.
 *
 * `SignInGate` is for a whole screen that belongs to an account — the
 * saved listings, offers, Me — and moves anyone signed out on from it.
 */

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSessionStore, useSignInPromptStore } from '@snt/core';
import { Button } from '../primitives/Button';
import { CompactLogo } from '../layout/Logo';
import { Sheet, useCloseSheet } from '../primitives/Sheet';
import styles from './SignIn.module.css';
import { startPageLoad } from '../pageLoad';

/** Shortest first, so the list widens as it goes down. */
const BENEFITS = [
  'See as many sellers’ numbers as you need',
  'Save listings and hear when the price drops',
  'Send offers, and get offers on what you post',
];

export function SignInHost() {
  const { prompt, close } = useSignInPromptStore();
  if (!prompt) return null;

  return (
    <Sheet
      narrow
      title="Sign in to continue"
      // As v1's sign-in prompt had it: the logo in the brand gradient, and
      // the heading under it, both centred — this is the app's own door.
      heading={
        <div className={styles.brandHead}>
          <CompactLogo height={56} gradient />
          <span className={styles.brandTitle}>Sign in to continue</span>
        </div>
      }
      onClose={close}
    >
      <SignInBody reason={prompt.reason} />
    </Sheet>
  );
}

function SignInBody({ reason }: { reason: string }) {
  const router = useRouter();
  const closeSheet = useCloseSheet();

  /**
   * "Continue with email": to the sign in page, which brings them back to
   * this page once they are in. The sheet sinks away as they go.
   */
  function toSignInPage() {
    const here = window.location.pathname + window.location.search;
    closeSheet();
    startPageLoad();
    router.push(`/signin?next=${encodeURIComponent(here)}`);
  }

  return (
    <>
      <p className={styles.reason}>{reason}</p>

      <ul className={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>

      {/* How the other ways in would look. Neither is connected to anything
          yet, and each says so when tapped rather than pretending. */}
      <div className={styles.providers}>
        <button
          type="button"
          className={[styles.provider, styles.google].join(' ')}
          onClick={() => toast('Signing in with Google is not available yet.')}
        >
          <GoogleMark />
          Continue with Google
        </button>
        <button
          type="button"
          className={[styles.provider, styles.facebook].join(' ')}
          onClick={() => toast('Signing in with Facebook is not available yet.')}
        >
          <FacebookMark />
          Continue with Facebook
        </button>
      </div>

      <div className={styles.or}>or</div>

      {/* The main way in: email and password, or a phone, on the sign in
          page. */}
      <Button size="lg" block onClick={toSignInPage}>
        Continue with email
      </Button>
    </>
  );
}

/**
 * Google's "G": the gradient one Google's sign in branding asks for, taken
 * as is from its own asset bundle (apps/web/public/brand/google-g.svg).
 */
export function GoogleMark() {
  return <img src="/brand/google-g.svg" width={18} height={18} alt="" aria-hidden />;
}

/** Facebook's "f", in white, for its blue button. */
export function FacebookMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.52c-1.49 0-1.95.93-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z"
      />
    </svg>
  );
}

/**
 * Shows `children` to someone signed in. Anyone else is moved on rather than
 * shown a screen of its own: someone who has just signed out goes home, and
 * someone who arrived signed out goes to the sign in page, which brings them
 * back here once they are in.
 */
export function SignInGate({ children }: { children: ReactNode }) {
  const signedIn = useSessionStore((state) => state.signedIn);
  /** A remembered sign in comes back a moment after the page loads: wait
      for it before moving anyone on. */
  const restored = useSessionStore((state) => state.restored);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (signedIn || !restored) return;
    const { signedOutAt } = useSessionStore.getState();
    const justLeft = signedOutAt !== null && Date.now() - signedOutAt < 5000;
    router.replace(
      justLeft ? '/' : `/signin?next=${encodeURIComponent(pathname ?? '/')}`,
    );
  }, [signedIn, restored, router, pathname]);

  return signedIn ? <>{children}</> : null;
}
