'use client';

/**
 * A short line on Stock for the owner of a store with a pass and no
 * Verified store badge (decision P38: a pass does not need the badge, so
 * the console invites them instead). Hidden for staff, for a verified store,
 * and while a request waits with our team.
 */

import { useSessionStore } from '@snt/core';
import { ButtonLink, useConsoleTarget } from '@snt/ui';
import { ShieldCheckIcon } from '@snt/ui/icons';
import styles from './page.module.css';

export function VerifyNudge() {
  const target = useConsoleTarget();
  const mine = useSessionStore((state) => state.viewer?.stores.find((store) => store.id === target?.id));
  if (!target || !mine || mine.role !== 'owner' || mine.verified || mine.verifyPending) return null;
  return (
    <div className={styles.nudge}>
      <span className={styles.nudgeIcon} aria-hidden>
        <ShieldCheckIcon size={18} />
      </span>
      <p className={styles.nudgeText}>
        Ask to be verified so buyers know a real business stands behind your store.
      </p>
      <ButtonLink href={`/store/${target.slug}/edit`} variant="secondary" size="sm">
        Ask to be verified
      </ButtonLink>
    </div>
  );
}
