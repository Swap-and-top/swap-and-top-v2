'use client';

/**
 * NotificationBell — the way to the Notifications page, in a header: a bell
 * in white, with the unread count in a red round on its corner, as counts
 * are on the console's sections. In the marketplace's header it is a
 * person's list (signed in only: a guest has none); in the console's, the
 * store's.
 */

import Link from 'next/link';
import {
  useSessionStore,
  useUnreadCount,
  type NotificationAudience,
} from '@snt/core';
import { BellIcon } from '../icons';
import { CountBadge } from '../primitives/Badge';
import styles from './Headers.module.css';

export function NotificationBell({
  audience,
  href,
}: {
  audience: NotificationAudience;
  href: string;
}) {
  const unread = useUnreadCount(audience);
  const signedIn = useSessionStore((state) => state.signedIn);
  // A guest has no list of their own.
  if (audience === 'user' && !signedIn) return null;
  return (
    <Link
      href={href}
      className={styles.bell}
      aria-label={
        unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
      }
    >
      <BellIcon size={22} />
      <span className={styles.bellCount} aria-hidden>
        <CountBadge count={unread} />
      </span>
    </Link>
  );
}
