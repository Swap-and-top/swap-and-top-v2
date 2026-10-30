'use client';

/**
 * The Staff console's password screen (see lib/staffPass.ts): shown to
 * anyone on the team whose device has no staff pass, or whose pass has
 * ended. The account's password, the one they sign in with (set in
 * Settings), opens the console on this device for 12 hours
 * (POST /api/staff/unlock). A phone code alone does not.
 */

import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '@snt/core';
import { AppHeader, Button, ButtonLink, Field, Panel, Screen, ScreenBody, Stack } from '@snt/ui';
import { ShieldCheckIcon } from '@snt/ui/icons';
import { apiSend } from '@/lib/query';
import { useStaffPassStore } from '@/lib/staffPass';
import styles from './StaffUnlock.module.css';

export function StaffUnlock() {
  const viewerId = useSessionStore((state) => state.viewer?.id);
  const keep = useStaffPassStore((state) => state.keep);
  const [password, setPassword] = useState('');

  const unlock = useMutation({
    mutationFn: () => apiSend<{ key: string; until: number; sealed: boolean }>('/staff/unlock', 'POST', { password }),
    onSuccess: ({ key, until, sealed }) => {
      if (viewerId) keep({ personId: viewerId, key, until, sealed });
    },
    onError: (error) => {
      setPassword('');
      toast.error(error.message);
    },
  });

  function open(event: FormEvent) {
    event.preventDefault();
    if (password) unlock.mutate();
  }

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <div className={styles.frame}>
          <Panel padded>
            <form onSubmit={open}>
              <Stack gap={5}>
                <div className={styles.head}>
                  <span className={styles.icon}>
                    <ShieldCheckIcon size={20} />
                  </span>
                  <h1 className={styles.title}>Staff console</h1>
                </div>
                <p className={styles.lead}>
                  Enter your password to open it. We ask once a day on each device, so a phone
                  code alone can’t open it.
                </p>
                <Field
                  label="Your password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="The one you sign in with"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoFocus
                />
                <Button type="submit" size="lg" block disabled={!password} loading={unlock.isPending}>
                  Open the Staff console
                </Button>
                <p className={styles.lead}>No password yet, or forgot it? Set one in Settings.</p>
                <div className={styles.actions}>
                  <ButtonLink href="/me/settings" variant="secondary">
                    Set a password
                  </ButtonLink>
                  <ButtonLink href="/me" variant="secondary">
                    Back to my profile
                  </ButtonLink>
                </div>
              </Stack>
            </form>
          </Panel>
        </div>
      </ScreenBody>
    </Screen>
  );
}
