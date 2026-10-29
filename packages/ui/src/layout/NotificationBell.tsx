'use client';

/**
 * NotificationBell — the way to the Notifications page, in a header: a bell
 * in white, with the unread count in a red round on its corner, as counts
 * are on the console's sections. In the marketplace's header it is a
 * person's list (signed in only: a guest has none); in the console's, the
 * store's.
 *
 * The person's bell is always in the page and shown by the mark on <html>
 * (`data-signed-in`, set before the first paint by the web app's layout and
 * kept in step with sign in), so it is there with the header, never a
 * moment after. A banned account sees it faded, and it does nothing.
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
  storeId,
}: {
  audience: NotificationAudience;
  href: string;
  /** In the console: which store's. */
  storeId?: string;
}) {
  const unread = useUnreadCount(audience, storeId);
  const banned = useSessionStore((state) => state.viewer?.standing === 'banned');
  // A guest has no list of their own: hidden while signed out.
  const className = [styles.bell, audience === 'user' ? styles.userBell : ''].filter(Boolean).join(' ');
  if (audience === 'user' && banned) {
    return (
      <span className={className} aria-disabled="true" aria-label="Notifications">
        <BellIcon size={22} />
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={className}
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
