'use client';

/**
 * "Please verify your email": the code step, to the first app's (it asked
 * for a code too). Shared by sign up, as its last step, and by sign in, for
 * someone whose email is not verified yet.
 *
 * Email is not set up yet, so no email is sent and the code is a mock one,
 * said on the card (MOCK_CODE in apps/api/src/supabaseAdmin.ts). Once it is
 * verified they are signed in with the password they just typed.
 */

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@snt/ui';
import { supabase } from '@/lib/supabase';
import styles from './SignInPage.module.css';

/** The mock code, until real email is set up. */
export const TEST_CODE = '123456';

export async function verifyEmailCode(email: string, code: string): Promise<string | null> {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (response.ok) return null;
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return body.error ?? 'We could not verify it. Try again in a minute.';
}

export function VerifyEmailStep({
  email,
  password,
  onDone,
}: {
  email: string;
  password: string;
  /** Verified and signed in. */
  onDone: () => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function verify(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    const problem = await verifyEmailCode(email, code.trim());
    if (problem) {
      setBusy(false);
      toast.error(problem);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      toast.error('Your email is verified. Sign in to carry on.');
      return;
    }
    onDone();
  }

  return (
    <>
      <h1 className={styles.lead}>Please verify your email.</h1>
      <p className={styles.sent}>
        Enter the code we sent to <strong>{email}</strong>.
      </p>
      <label className={styles.field}>
        <span className={styles.label}>Verification code</span>
        <span className={styles.box}>
          <input
            className={styles.input}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="e.g. 123456"
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (code.length === 6 && !busy) void verify();
              }
            }}
          />
        </span>
      </label>
      <p className={styles.note}>
        While email is being set up, no email is sent: the code is {TEST_CODE}.
      </p>
      <button
        type="button"
        className={styles.signIn}
        disabled={busy || code.length < 6}
        aria-busy={busy || undefined}
        onClick={() => void verify()}
      >
        {busy ? <Spinner size={20} label="Verifying" /> : 'Verify email'}
      </button>
    </>
  );
}
