'use client';

/**
 * The sign-in page itself. See page.tsx.
 *
 * Built to the first app's log-in page, to its sizes: no header; on a phone
 * one card on the page — the 3D door, "Sign in to Swap & Top", email and
 * password, then the ways in; from tablet up the card on the brand gradient
 * beside "Sign in to / Swap & Top" over the large 3D scene; the footer under.
 *
 * Signing in is not live yet: there are no accounts to check details against.
 * "Sign in" carries on as the sample member whatever is typed — nothing typed
 * here is sent anywhere or kept. When real sign-in arrives it goes behind the
 * same button.
 */

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '@snt/core';
import { FacebookMark, Footer, GoogleMark, Img } from '@snt/ui';
import styles from './SignInPage.module.css';

export function SignInPage({ next }: { next: string }) {
  const router = useRouter();
  const signIn = useSessionStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    signIn();
    toast.success('Sign in successful');
    router.push(next);
  }

  const notYet = (what: string) => () => toast(`${what} is not available yet.`);

  return (
    <div className={styles.page}>
      <div className={styles.mainWrapper}>
        <main className={styles.content}>
          {/* From tablet up: the welcome, large and white on the gradient,
              over the 3D logo and door. */}
          <div className={styles.picture} aria-hidden>
            <div className={styles.welcome}>
              <span className={`${styles.welcomeLine} ${styles.medium}`}>
                Sign in to
              </span>
              <span className={`${styles.welcomeLine} ${styles.large}`}>
                Swap &amp; Top
              </span>
            </div>
            <Img src="/signin/hero.png" alt="" pulse={false} className={styles.hero} />
          </div>

          <form className={styles.form} onSubmit={submit}>
            {/* On a phone: the 3D door over the heading. */}
            <div className={styles.door}>
              <Img src="/signin/door.png" alt="" pulse={false} />
            </div>
            <h1 className={styles.heading}>Sign in to Swap &amp; Top</h1>

            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <span className={styles.box}>
                <input
                  className={styles.input}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="e.g johndoe@gmail.com"
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
                  autoComplete="off"
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

            <button
              type="button"
              className={styles.forgot}
              onClick={notYet('Resetting a password')}
            >
              Forgot password?
            </button>

            <button type="submit" className={styles.signIn}>
              Sign in
            </button>
            <button
              type="button"
              className={styles.create}
              onClick={notYet('Creating an account')}
            >
              Create new account
            </button>

            <div className={styles.or}>
              <span className={styles.orLine} />
              <span>or</span>
              <span className={styles.orLine} />
            </div>

            <button
              type="button"
              className={`${styles.platform} ${styles.google}`}
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
          </form>
        </main>
      </div>
      <Footer />
    </div>
  );
}

/** The first app's show-password eye, open. */
function EyeOpen() {
  return (
    <svg viewBox="0 0 107.26 67" aria-hidden>
      <path d="M51.83,0C23.25,0,0,15.66,0,34.92s23.25,34.92,51.83,34.92,51.830-15.66,51.830-34.92S80.4,0,51.83,0Zm43.83,34.92c0,6.68-4.2,13.15-11.84,18.21-8.45,5.61-19.81,8.7-31.99,8.7s-23.54-3.090-31.99-8.7c-7.63-5.070-11.84-11.54-11.84-18.21s4.2-13.15,11.84-18.21c8.45-5.61,19.81-8.7,31.99-8.7s23.54,3.090,31.99,8.7c7.63,5.070,11.84,11.54,11.84,18.21Z" />
      <path d="M51.83,19.43c-8.54,0-15.48,6.95-15.48,15.48s6.95,15.48,15.48,15.48,15.48-6.95,15.48-15.48-6.95-15.48-15.48-15.48Zm7.48,15.48c0,4.13-3.36,7.48-7.48,7.48s-7.48-3.36-7.48-7.48,3.36-7.48,7.48-7.48,7.48,3.36,7.48,7.48Z" />
    </svg>
  );
}

/** And struck through, once the password is shown. */
function EyeClosed() {
  return (
    <svg viewBox="0 0 107.26 67" aria-hidden>
      <path d="M97.07,20.72c-.82-.92-1.95-1.44-3.19-1.47-1.24-.06-2.44,.45-3.31,1.32h0c-1.68,1.68-1.75,4.4-.15,6.19,3.42,3.83,5.23,8.1,5.23,12.36,0,6.5-4.12,12.83-11.61,17.8-8.37,5.56-19.63,8.62-31.71,8.62-1.38,0-2.81-.05-4.39-.16-1.3-.09-2.57,.39-3.51,1.33-1.27,1.26-1.66,3.09-1.03,4.77,.63,1.67,2.12,2.78,3.9,2.9,1.67,.11,3.36,.16,5.03,.16,28.85,0,52.33-15.89,52.33-35.42,0-6.52-2.62-12.88-7.58-18.4Z" />
      <path d="M96.5,1.46h0c-.94-.94-2.2-1.46-3.54-1.46s-2.59,.52-3.54,1.46l-8.14,8.14c-8.59-3.86-18.58-5.9-28.97-5.9C23.47,3.7,0,19.59,0,39.12c0,11.83,8.39,22.58,22.6,29.18l-6.56,6.56c-.94,.94-1.46,2.2-1.46,3.54s.52,2.59,1.46,3.54c.94,.94,2.2,1.46,3.54,1.46s2.59-.52,3.54-1.46L96.5,8.54c.94-.94,1.46-2.2,1.46-3.54s-.52-2.59-1.46-3.54Zm-44.18,30.67c1.73,0,3.38,.65,4.65,1.78l-9.85,9.850c-1.14-1.27-1.78-2.92-1.78-4.65,0-3.85,3.13-6.98,6.98-6.98Zm0-9c-8.81,0-15.98,7.17-15.98,15.98,0,4.14,1.59,8.04,4.43,11.01l-11.32,11.32c-3.23-1.26-6.2-2.78-8.83-4.53-7.49-4.97-11.61-11.29-11.61-17.8s4.12-12.83,11.61-17.8c8.37-5.56,19.63-8.62,31.71-8.62,7.85,0,15.42,1.3,22.090,3.78l-11.080,11.080c-2.96-2.84-6.87-4.43-11-4.43Z" />
    </svg>
  );
}
