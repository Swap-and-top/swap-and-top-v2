'use client';

/**
 * Forgot password, to the first app's: the 3D key and arrows under "Forgot
 * your / Swap & Top / password?", and a card asking for the email. Supabase
 * sends a link to it, which opens /signin/reset to choose a new password.
 *
 * Whether the email is on an account is never said, so the page cannot be
 * used to find out who has one.
 */

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ButtonLink, Spinner } from '@snt/ui';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '../AuthLayout';
import styles from '../SignInPage.module.css';

export function ForgotPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  /** The address the link went to; the card then says to open it. */
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function send(to: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(to, {
      redirectTo: `${window.location.origin}/signin/reset`,
    });
    if (error) {
      toast.error('We could not send the email. Try again in a minute.');
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const to = email.trim();
    if (!to) {
      toast.error('Enter your email.');
      return;
    }
    setBusy(true);
    const sent = await send(to);
    setBusy(false);
    if (sent) setSentTo(to);
  }

  async function sendAgain() {
    if (sentTo && (await send(sentTo))) toast.success(`We sent the link again to ${sentTo}.`);
  }

  return (
    <AuthLayout
      lines={['Forgot your', 'Swap & Top', 'password?']}
      picture={{ hero: '/signin/key-hero.png', icon: '/signin/key.png' }}
      onSubmit={submit}
    >
      {sentTo ? (
        <>
          <h1 className={styles.lead}>Check your email</h1>
          <p className={styles.sent}>
            If <strong>{sentTo}</strong> is on an account, we sent it a link to
            choose a new password. It may take a minute to arrive.
          </p>
          <ButtonLink href="/signin" variant="secondary" size="lg" block>
            Back to sign in
          </ButtonLink>
          <p className={styles.join}>
            Didn’t get it?{' '}
            <button type="button" className={styles.joinLink} onClick={sendAgain}>
              Send it again
            </button>
          </p>
        </>
      ) : (
        <>
          <h1 className={styles.lead}>Enter your email below to reset your password</h1>

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
          <p className={styles.note} />

          <button
            type="submit"
            className={styles.signIn}
            disabled={busy}
            aria-busy={busy || undefined}
          >
            {busy ? <Spinner size={20} label="Sending the email" /> : 'Send email'}
          </button>
          <ButtonLink href="/signin" variant="secondary" size="lg" block className={styles.back}>
            Back to sign in
          </ButtonLink>

          <p className={styles.join}>
            Don’t have an account?{' '}
            <Link href="/signup" className={styles.joinLink}>
              Sign up
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
