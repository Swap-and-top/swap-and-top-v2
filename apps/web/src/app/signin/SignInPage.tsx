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
import { useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '@snt/core';
import {
  Button,
  EyeClosed,
  EyeOpen,
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
  /** The browser filled in a saved email or password: Chrome shows them
      but keeps them from the page until a tap, so Sign in goes on then,
      and reads the boxes themselves when pressed. */
  const [autofilled, setAutofilled] = useState(false);
  const emailBox = useRef<HTMLInputElement>(null);
  const passwordBox = useRef<HTMLInputElement>(null);
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
    // Sign in stays off until both are filled in (Hillary, 2026-11-06);
    // what the browser filled in is read from the boxes.
    const givenEmail = (email || emailBox.current?.value || '').trim();
    const givenPassword = password || passwordBox.current?.value || '';
    if (!givenEmail || !givenPassword) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: givenEmail,
      password: givenPassword,
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
                ref={emailBox}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onAnimationStart={(event) => {
                  if (event.animationName.includes('autofill')) setAutofilled(true);
                }}
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
                ref={passwordBox}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onAnimationStart={(event) => {
                  if (event.animationName.includes('autofill')) setAutofilled(true);
                }}
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
            // Off until an email and a password are typed, so the only
            // message left is a wrong pair (Hillary, 2026-11-06).
            disabled={busy || (!autofilled && (!email.trim() || !password))}
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
            // Send code off until a number is typed, Sign in until the
            // code's six digits are.
            disabled={busy || (phone === null ? !typed.trim() : code.length < 6)}
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
