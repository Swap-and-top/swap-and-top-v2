'use client';

/**
 * The sign in page itself. See page.tsx.
 *
 * Built to the first app's log in page, to its sizes: no header; on a phone
 * one card on the page, the 3D door, "Sign in to Swap & Top", the ways in;
 * from tablet up the card on the brand gradient beside "Sign in to / Swap &
 * Top" over the large 3D scene; the footer under.
 *
 * Two ways in, through Supabase Auth, the same height so the card does not
 * jump between them:
 *
 * - Email (on show first): the email and password they signed up with, or
 *   added in Settings. An email not yet verified is asked for its code
 *   first, as in the first app (VerifyEmail).
 * - Phone, from "Continue with phone" under "or": the number, "Send
 *   code", then the code and "Sign in". A number seen for the first time
 *   makes a new account.
 *
 * "Don't have an account? Sign up", at the foot of the card, goes to the sign
 * up page. The test numbers 077 000 0001 to 0007 take the
 *   code 123456 and send no SMS.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '@snt/core';
import {
  Button,
  FacebookMark,
  GoogleMark,
  Spinner,
  startPageLoad,
} from '@snt/ui';
import { MailIcon, PhoneIcon } from '@snt/ui/icons';
import { supabase, toPhone } from '@/lib/supabase';
import { toastOnArrival } from '@/components/SignInToast';
import { AuthLayout } from './AuthLayout';
import { VerifyEmailStep } from './VerifyEmail';
import styles from './SignInPage.module.css';

type Way = 'phone' | 'email';

/** +263771234567 as people write it: 077 123 4567. */
const shown = (phone: string) => {
  const local = phone.slice(4);
  return `0${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
};

export function SignInPage({ next }: { next: string }) {
  const router = useRouter();
  const [way, setWay] = useState<Way>('email');
  const [typed, setTyped] = useState('');
  /** The number a code went to; the code step shows once it is set. */
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Signed in with an email not yet verified: the card asks for its code. */
  const [verifying, setVerifying] = useState(false);

  /** Once the API has said who they are, so a banned account goes straight
      to its ban, never the marketplace first. The button keeps spinning
      meanwhile, however long that takes (the first time can be several
      seconds, and it is tried again if the server cannot be reached). If
      it still cannot say, or after a minute, they are signed out again,
      cleanly, and told, and can simply try again. */
  function signedIn() {
    const go = () => {
      // Shown once the next page is up (SignInToast).
      toastOnArrival();
      startPageLoad();
      router.push(next);
    };
    const fail = () => {
      void supabase.auth.signOut();
      setBusy(false);
      // From the email code step too: back to the card, to sign in again.
      setVerifying(false);
      toast.error('We could not sign you in. Check your connection and try again.');
    };
    if (useSessionStore.getState().viewer) return go();
    useSessionStore.setState({ viewerFailed: false });
    const stop = window.setTimeout(() => {
      unsubscribe();
      fail();
    }, 60_000);
    const unsubscribe = useSessionStore.subscribe((state) => {
      if (!state.viewer && !state.viewerFailed) return;
      window.clearTimeout(stop);
      unsubscribe();
      if (state.viewer) go();
      else fail();
    });
  }

  async function sendCode() {
    const to = toPhone(typed);
    if (!to) {
      toast.error('Enter your mobile number, like 077 123 4567, or with its country code, like +27 82 123 4567.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: to });
    setBusy(false);
    if (error) {
      toast.error('We could not send a code to that number. Try again in a minute.');
      return;
    }
    setCode('');
    setPhone(to);
  }

  async function checkCode() {
    if (!phone) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code.trim(),
      type: 'sms',
    });
    if (error) {
      setBusy(false);
      toast.error('That code is not right. Check it and try again.');
      return;
    }
    signedIn();
  }

  async function signInWithEmail() {
    if (!email.trim() || !password) {
      toast.error('Enter your email and password.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error?.code === 'email_not_confirmed') {
      // As the first app did: the card asks for the email's code first.
      setBusy(false);
      setVerifying(true);
      return;
    }
    if (error) {
      setBusy(false);
      toast.error('That email and password do not match an account.');
      return;
    }
    signedIn();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (way === 'email') void signInWithEmail();
    else if (phone) void checkCode();
    else void sendCode();
  }

  const notYet = (what: string) => () => toast(`${what} is not available yet.`);

  if (verifying) {
    return (
      <AuthLayout
        tall
        lines={['Please verify', 'Swap & Top', 'account']}
        picture={{ hero: '/signin/mail-hero.png', icon: '/signin/plane.png', wideIcon: true, smallHero: true }}
      >
        <VerifyEmailStep email={email.trim()} password={password} onDone={signedIn} />
        <Button
          type="button"
          variant="secondary"
          size="lg"
          block
          className={styles.back}
          onClick={() => setVerifying(false)}
        >
          Back to sign in
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      lines={['Sign in to', 'Swap & Top']}
      picture={{ hero: '/signin/hero.png', icon: '/signin/door.png' }}
      onSubmit={submit}
    >
      <h1 className={styles.heading}>Sign in to Swap &amp; Top</h1>

      {/* Both ways are drawn in the same spot, the one not in use
          hidden, so the card is the email form's height either way and
          the phone form sits in the middle of that space. */}
      <div className={styles.stage}>
        <div
          className={[styles.pane, way === 'email' ? '' : styles.paneHidden]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={way !== 'email' || undefined}
          inert={way !== 'email'}
        >
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="e.g. johndoe@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.eye}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </span>
          </label>

          <Link href="/signin/forgot" className={styles.forgot}>
            Forgot password?
          </Link>

          {/* While waiting, the first app's spinner where the words
              were, and no second press. */}
          <button
            type={way === 'email' ? 'submit' : 'button'}
            className={styles.signIn}
            disabled={busy}
            aria-busy={(busy && way === 'email') || undefined}
          >
            {busy && way === 'email' ? <Spinner size={20} label="Signing in" /> : 'Sign in'}
          </button>
        </div>

        <div
          className={[styles.pane, way === 'phone' ? '' : styles.paneHidden]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={way !== 'phone' || undefined}
          inert={way !== 'phone'}
        >
          {phone ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Code</span>
                <span className={styles.box}>
                  <input
                    key="code"
                    className={styles.input}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    autoFocus
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  />
                </span>
              </label>
              <p className={styles.note}>We sent a code by SMS to {shown(phone)}.</p>
            </>
          ) : (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Phone number</span>
                <span className={styles.box}>
                  <input
                    key="phone"
                    className={styles.input}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="e.g. 077 123 4567"
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                  />
                </span>
              </label>
              <p className={styles.note}>
                We send you a code by SMS. New here? This makes your account.
              </p>
            </>
          )}

          <button
            type={way === 'phone' ? 'submit' : 'button'}
            className={styles.signIn}
            disabled={busy || (phone !== null && code.length < 6)}
            aria-busy={(busy && way === 'phone') || undefined}
          >
            {busy && way === 'phone' ? (
              <Spinner size={20} label={phone ? 'Signing in' : 'Sending the code'} />
            ) : phone ? (
              'Sign in'
            ) : (
              'Send code'
            )}
          </button>
          {phone ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              block
              className={styles.change}
              onClick={() => setPhone(null)}
            >
              Change number
            </Button>
          ) : null}
        </div>
      </div>

      <div className={styles.or}>
        <span className={styles.orLine} />
        <span>or</span>
        <span className={styles.orLine} />
      </div>

      {/* The other of the two ways in, first among the others. */}
      <button
        type="button"
        className={`${styles.platform} ${styles.other}`}
        onClick={() => setWay(way === 'email' ? 'phone' : 'email')}
      >
        <span className={styles.platformLogo}>
          {way === 'email' ? <PhoneIcon size={18} /> : <MailIcon size={18} />}
        </span>
        {way === 'email' ? 'Continue with phone' : 'Continue with email'}
      </button>
      <button
        type="button"
        className={`${styles.platform} ${styles.google} ${styles.next}`}
        onClick={notYet('Signing in with Google')}
      >
        <span className={styles.platformLogo}>
          <GoogleMark />
        </span>
        Continue with Google
      </button>
      <button
        type="button"
        className={`${styles.platform} ${styles.facebook}`}
        onClick={notYet('Signing in with Facebook')}
      >
        <span className={styles.platformLogo}>
          <FacebookMark />
        </span>
        Continue with Facebook
      </button>

      <p className={styles.join}>
        Don’t have an account?{' '}
        <Link
          href={next === '/' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
          className={styles.joinLink}
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

/** The first app's show-password eye, open. */
export function EyeOpen() {
  return (
    <svg viewBox="0 0 107.26 67" aria-hidden>
      <path d="M51.83,0C23.25,0,0,15.66,0,34.92s23.25,34.92,51.83,34.92,51.830-15.66,51.830-34.92S80.4,0,51.83,0Zm43.83,34.92c0,6.68-4.2,13.15-11.84,18.21-8.45,5.61-19.81,8.7-31.99,8.7s-23.54-3.090-31.99-8.7c-7.63-5.070-11.84-11.54-11.84-18.21s4.2-13.15,11.84-18.21c8.45-5.61,19.81-8.7,31.99-8.7s23.54,3.090,31.99,8.7c7.63,5.070,11.84,11.54,11.84,18.21Z" />
      <path d="M51.83,19.43c-8.54,0-15.48,6.95-15.48,15.48s6.95,15.48,15.48,15.48,15.48-6.95,15.48-15.48-6.95-15.48-15.48-15.48Zm7.48,15.48c0,4.13-3.36,7.48-7.48,7.48s-7.48-3.36-7.48-7.48,3.36-7.48,7.48-7.48,7.48,3.36,7.48,7.48Z" />
    </svg>
  );
}

/** And struck through, once the password is shown. */
export function EyeClosed() {
  return (
    <svg viewBox="0 0 107.26 67" aria-hidden>
      <path d="M97.07,20.72c-.82-.92-1.95-1.44-3.19-1.47-1.24-.06-2.44,.45-3.31,1.32h0c-1.68,1.68-1.75,4.4-.15,6.19,3.42,3.83,5.23,8.1,5.23,12.36,0,6.5-4.12,12.83-11.61,17.8-8.37,5.56-19.63,8.62-31.71,8.62-1.38,0-2.81-.05-4.39-.16-1.3-.09-2.57,.39-3.51,1.33-1.27,1.26-1.66,3.09-1.03,4.77,.63,1.67,2.12,2.78,3.9,2.9,1.67,.11,3.36,.16,5.03,.16,28.85,0,52.33-15.89,52.33-35.42,0-6.52-2.62-12.88-7.58-18.4Z" />
      <path d="M96.5,1.46h0c-.94-.94-2.2-1.46-3.54-1.46s-2.59,.52-3.54,1.46l-8.14,8.14c-8.59-3.86-18.58-5.9-28.97-5.9C23.47,3.7,0,19.59,0,39.12c0,11.83,8.39,22.58,22.6,29.18l-6.56,6.56c-.94,.94-1.46,2.2-1.46,3.54s.52,2.59,1.46,3.54c.94,.94,2.2,1.46,3.54,1.46s2.59-.52,3.54-1.46L96.5,8.54c.94-.94,1.46-2.2,1.46-3.54s-.52-2.59-1.46-3.54Zm-44.18,30.67c1.73,0,3.38,.65,4.65,1.78l-9.85,9.850c-1.14-1.27-1.78-2.92-1.78-4.65,0-3.85,3.13-6.98,6.98-6.98Zm0-9c-8.81,0-15.98,7.17-15.98,15.98,0,4.14,1.59,8.04,4.43,11.01l-11.32,11.32c-3.23-1.26-6.2-2.78-8.83-4.53-7.49-4.97-11.61-11.29-11.61-17.8s4.12-12.83,11.61-17.8c8.37-5.56,19.63-8.62,31.71-8.62,7.85,0,15.42,1.3,22.090,3.78l-11.080,11.080c-2.96-2.84-6.87-4.43-11-4.43Z" />
    </svg>
  );
}
