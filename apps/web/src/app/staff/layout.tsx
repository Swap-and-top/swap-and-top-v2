'use client';

/**
 * The Staff console's gate: for our own team only (anyone in a department,
 * and the super admin). Signed out, they are sent to sign in; not on the
 * team, they are told so; on it, they enter their password once a day on
 * each device (StaffUnlock, lib/staffPass.ts). Each section is checked
 * again by the API, which also wants the staff pass.
 */

import type { ReactNode } from 'react';
import { useSessionStore } from '@snt/core';
import { AppHeader, ButtonLink, EmptyState, Screen, ScreenBody, SignInGate } from '@snt/ui';
import { useOnTeam } from '@/lib/staff';
import { useHasStaffPass, useSealedPass } from '@/lib/staffPass';
import styles from './layout.module.css';
import { StaffUnlock } from './StaffUnlock';

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <SignInGate>
      <Gate>{children}</Gate>
    </SignInGate>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const known = useSessionStore((state) => state.viewer !== null);
  const viewerId = useSessionStore((state) => state.viewer?.id);
  const onTeam = useOnTeam();
  /** This device has been opened with their password today. */
  const passed = useHasStaffPass(viewerId);
  /** Opened with the sealed super admin account. */
  const sealed = useSealedPass(viewerId);
  // Who they are comes from the API a moment after sign in: until then
  // the console's frame and skeletons show, not a blank page (the API
  // shows nothing to anyone off the team).
  if (known && !onTeam) {
    return (
      <Screen>
        <AppHeader />
        <ScreenBody>
          <EmptyState
            title="The Staff console is for our team"
            body="It opens for users in one of Swap & Top's departments."
            action={
              <ButtonLink href="/me" variant="secondary" size="lg" block>
                Back to my profile
              </ButtonLink>
            }
          />
        </ScreenBody>
      </Screen>
    );
  }
  // On the team, but not yet opened with their password on this device.
  if (known && onTeam && !passed) return <StaffUnlock />;
  return (
    <>
      {/* The sealed account in use: said plainly the whole time. */}
      {sealed ? (
        <p className={styles.sealed} role="status">
          You are using the sealed super admin account. The other super admin has been told.
        </p>
      ) : null}
      {children}
    </>
  );
}
