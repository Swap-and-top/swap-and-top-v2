'use client';

/**
 * Settings: the phone number, which lets them post and make offers once
 * verified (VerifyPhone), and the email and password to sign in with. Someone who signed up
 * by phone adds them here as a second way in to the same account; someone
 * who signed up by email can change them. A new email only counts once the
 * code sent to it is entered; until then the old one stays. The password
 * works straight away.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  AppHeader,
  Button,
  ButtonLink,
  Field,
  FieldRow,
  Panel,
  Screen,
  ScreenBody,
  SignInGate,
  Stack,
} from '@snt/ui';
import { useSessionStore } from '@snt/core';
import { PhoneForm, shownPhone } from '@/components/VerifyPhone';
import { changeEmail, requestEmailChange, signInEmail } from '@/lib/account';
import { ApiError, apiSend } from '@/lib/query';
import styles from './page.module.css';

export default function SettingsPage() {
  const viewer = useSessionStore((state) => state.viewer);
  /** Changing a verified number: the form shows again. */
  const [changingPhone, setChangingPhone] = useState(false);
  /** The email they sign in with now, if they have one. */
  const [current, setCurrent] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  /** The new email a code went to; the code step shows once it is set. */
  const [pending, setPending] = useState<string | null>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    void signInEmail().then((now) => {
      setCurrent(now);
      setEmail(now ?? '');
    });
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const newEmail = email.trim() && email.trim() !== current ? email.trim() : undefined;
    if (!newEmail && !password) {
      toast('Nothing to save yet.');
      return;
    }
    if (password && password.length < 8) {
      toast.error('Choose a longer password, at least 8 characters.');
      return;
    }
    setBusy(true);
    if (password) {
      const error = await apiSend('/me/password', 'PUT', { password }).then(
        () => null,
        (problem: unknown) => problem,
      );
      if (error) {
        setBusy(false);
        toast.error(error instanceof ApiError ? error.message : 'We could not save it. Try again in a minute.');
        return;
      }
      setPassword('');
      if (!newEmail) toast.success('Password saved');
    }
    if (newEmail) {
      const sent = await requestEmailChange(newEmail);
      if (!sent) {
        setBusy(false);
        toast.error('We could not send a code to that email. Check it and try again.');
        return;
      }
      setCode('');
      setPending(newEmail);
    }
    setBusy(false);
  }

  /** The code for the new email: right, and it becomes their email. */
  async function verifyEmail(event: FormEvent) {
    event.preventDefault();
    if (!pending) return;
    setBusy(true);
    const changed = await changeEmail(pending, code.trim());
    setBusy(false);
    if (!changed) {
      toast.error('That code is not right, or the email is already on another account.');
      return;
    }
    setCurrent(pending);
    setEmail(pending);
    setPending(null);
    toast.success('Email saved');
  }

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <h1 className={styles.title}>Settings</h1>

            <Panel padded>
              <h2 className={styles.heading}>Phone number</h2>
              {viewer?.phoneVerified && viewer.phone && !changingPhone ? (
                <>
                  <p className={styles.lead}>
                    {shownPhone(viewer.phone)} is verified. You can post listings
                    and send offers.
                  </p>
                  <Button variant="secondary" block onClick={() => setChangingPhone(true)}>
                    Change number
                  </Button>
                </>
              ) : (
                <>
                  <p className={styles.lead}>
                    Verify your phone number to post listings and send offers.
                  </p>
                  <PhoneForm onDone={() => setChangingPhone(false)} />
                </>
              )}
            </Panel>

            <Panel padded>
              {pending ? (
                <form onSubmit={verifyEmail}>
                  <h2 className={styles.heading}>Verify your email</h2>
                  <p className={styles.lead}>
                    Enter the code we sent to <strong>{pending}</strong>.
                  </p>
                  <Field
                    label="Code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    autoFocus
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  />
                  <p className={styles.note}>
                    While email is being set up, no email is sent: the code is 123456.
                  </p>
                  <Button type="submit" block className={styles.save} loading={busy} disabled={code.length < 6}>
                    Verify email
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    block
                    className={styles.cancel}
                    onClick={() => {
                      setPending(null);
                      setEmail(current ?? '');
                    }}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <form onSubmit={save}>
                  <h2 className={styles.heading}>Email and password</h2>
                  <p className={styles.lead}>
                    {current
                      ? `You sign in with ${current} and your password.`
                      : 'Add them to sign in with your email as well as your phone.'}
                  </p>
                  <FieldRow>
                    <Field
                      label="Email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="e.g. johndoe@gmail.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <Field
                      label={current ? 'New password' : 'Password'}
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </FieldRow>
                  <Button type="submit" block className={styles.save} loading={busy}>
                    Save
                  </Button>
                </form>
              )}
            </Panel>

            <ButtonLink href="/me" variant="secondary" block>
              Back to my profile
            </ButtonLink>
          </Stack>
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
