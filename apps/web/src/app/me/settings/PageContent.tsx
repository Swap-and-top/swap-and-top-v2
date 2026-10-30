'use client';

/**
 * Settings: the phone number, which lets them post and make offers once
 * verified (VerifyPhone), and the email and password to sign in with. Someone who signed up
 * by phone adds them here as a second way in to the same account; someone
 * who signed up by email can change them. A new email only counts once its
 * owner opens the link Supabase sends to it. The password works straight
 * away.
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
import { supabase } from '@/lib/supabase';
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

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const now = data.user?.email || null;
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
    const { error } = await supabase.auth.updateUser({
      ...(newEmail ? { email: newEmail } : {}),
      ...(password ? { password } : {}),
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.code === 'email_exists'
          ? 'That email is already on another account.'
          : error.code === 'weak_password'
            ? 'Choose a longer password, at least 8 characters.'
            : error.code === 'email_address_invalid'
              ? 'Check the email, it does not look right.'
              : 'We could not save it. Try again in a minute.',
      );
      return;
    }
    setPassword('');
    if (newEmail) {
      toast.success(`We sent a link to ${newEmail}. Open it to finish adding your email.`);
    } else {
      toast.success('Password saved');
    }
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
