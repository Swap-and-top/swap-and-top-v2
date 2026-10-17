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
 * "Continue with email", which goes to the sign-in page and back.
 *
 * `SignInGate` is for a whole screen that belongs to an account — the
 * saved listings, offers, Me.
 */

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSessionStore, useSignInPromptStore } from '@snt/core';
import { EmptyState } from '../layout/Screen';
import { Button } from '../primitives/Button';
import { CompactLogo } from '../layout/Logo';
import { Sheet, useCloseSheet } from '../primitives/Sheet';
import styles from './SignIn.module.css';

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
   * "Continue with email": to the sign-in page, which brings them back to
   * this page once they are in. The sheet sinks away as they go.
   */
  function toSignInPage() {
    const here = window.location.pathname + window.location.search;
    closeSheet();
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

      {/* The usual third way in, after Google and Facebook: email, on the
          sign-in page. */}
      <Button size="lg" block onClick={toSignInPage}>
        Continue with email
      </Button>
    </>
  );
}

/** Google's "G", in its own four colours. */
export function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
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

/** Shows `children` to someone signed in, and a way to sign in to a guest. */
export function SignInGate({
  title,
  body,
  reason,
  children,
}: {
  title: string;
  body: string;
  /** Shown in the sign-in sheet. */
  reason: string;
  children: ReactNode;
}) {
  const signedIn = useSessionStore((state) => state.signedIn);
  const ask = useSignInPromptStore((state) => state.ask);

  if (signedIn) return <>{children}</>;

  return (
    <EmptyState
      title={title}
      body={body}
      action={<Button onClick={() => ask({ reason })}>Sign in</Button>}
    />
  );
}
