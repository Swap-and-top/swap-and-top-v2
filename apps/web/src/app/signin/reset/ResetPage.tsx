'use client';

/**
 * Choosing a new password, where the link in a forgot password email lands:
 * the first app's reset page, the 3D key and arrows under "Reset your / Swap
 * & Top / password", then its success, "Password reset for / Swap & Top /
 * was successful!".
 *
 * The link signs the visitor in for this one purpose (Supabase reads it from
 * the address as the page loads). They choose a new password and carry on
 * signed in. A link that has expired or was used says so, with a way back.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ButtonLink, Spinner } from '@snt/ui';
import { CheckIcon } from '@snt/ui/icons';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '../AuthLayout';
import styles from '../SignInPage.module.css';

const picture = { hero: '/signin/key-hero.png', icon: '/signin/key.png' };

export function ResetPage() {
  /** Whether the link worked: unknown until Supabase has read it. */
  const [linked, setLinked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes('error')) {
      setLinked(false);
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLinked(session !== null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error('Choose a longer password, at least 8 characters.');
      return;
    }
    if (again !== password) {
      toast.error('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(
        error.code === 'weak_password'
          ? 'Choose a longer password, at least 8 characters.'
          : error.code === 'same_password'
            ? 'Choose a password you have not used before.'
            : 'We could not save it. Try again in a minute.',
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthLayout lines={['Password reset for', 'Swap & Top', 'was successful!']} picture={picture}>
        <span className={styles.tick} aria-hidden>
          <CheckIcon size={32} />
        </span>
        <h1 className={styles.lead}>Password reset successful</h1>
        <p className={styles.sent}>Your new password is saved, and you are signed in.</p>
        <ButtonLink href="/" size="lg" block>
          Continue
        </ButtonLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout lines={['Reset your', 'Swap & Top', 'password']} picture={picture} onSubmit={save}>
      {linked === false ? (
        <>
          <h1 className={styles.lead}>This link has expired</h1>
          <p className={styles.sent}>
            It may have been used already. Ask for a new one and use the
            newest email.
          </p>
          <ButtonLink href="/signin/forgot" size="lg" block>
            Send a new link
          </ButtonLink>
          <ButtonLink href="/signin" variant="secondary" size="lg" block className={styles.back}>
            Back to sign in
          </ButtonLink>
        </>
      ) : (
        <>
          <h1 className={styles.lead}>Choose a new password</h1>

          <label className={styles.field}>
            <span className={styles.label}>New password</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Confirm new password</span>
            <span className={styles.box}>
              <input
                className={styles.input}
                type="password"
                autoComplete="new-password"
                placeholder="Enter it again"
                value={again}
                onChange={(event) => setAgain(event.target.value)}
              />
            </span>
          </label>
          <p className={styles.note} />

          <button
            type="submit"
            className={styles.signIn}
            disabled={busy || !linked}
            aria-busy={busy || undefined}
          >
            {busy ? <Spinner size={20} label="Saving" /> : 'Reset password'}
          </button>
        </>
      )}
    </AuthLayout>
  );
}
