'use client';

/**
 * The Staff console's gate: for our own team only (anyone in a department,
 * and the super admin). Signed out, they are sent to sign in; not on the
 * team, they are told so. Each section is checked again by the API.
 */

import type { ReactNode } from 'react';
import { useSessionStore } from '@snt/core';
import { AppHeader, ButtonLink, EmptyState, Screen, ScreenBody, SignInGate } from '@snt/ui';
import { useOnTeam } from '@/lib/staff';

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <SignInGate>
      <Gate>{children}</Gate>
    </SignInGate>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const known = useSessionStore((state) => state.viewer !== null);
  const onTeam = useOnTeam();
  // Who they are comes from the API a moment after sign in.
  if (!known) return null;
  if (!onTeam) {
    return (
      <Screen>
        <AppHeader />
        <ScreenBody>
          <EmptyState
            title="The Staff console is for our team"
            body="It opens for people in one of Swap & Top's departments."
            action={
              <ButtonLink href="/" variant="secondary" size="lg" block>
                Back to marketplace
              </ButtonLink>
            }
          />
        </ScreenBody>
      </Screen>
    );
  }
  return <>{children}</>;
}
