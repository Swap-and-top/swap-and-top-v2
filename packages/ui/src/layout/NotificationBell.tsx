'use client';

/**
 * NotificationBell: a bell in a header, in white, with the unread count in
 * a red round on its corner, as counts are on the console's sections. In
 * the marketplace's header it is a user's (signed in only: a guest has
 * none) and opens a drop down of the newest few, with See all
 * notifications (NotificationMenu); in the console's, it is the store's
 * and goes straight to its Notifications page.
 *
 * The person's bell is always in the page and shown by the mark on <html>
 * (`data-signed-in`, set before the first paint by the web app's layout and
 * kept in step with sign in), so it is there with the header, never a
 * moment after. A banned account sees it faded, and it does nothing.
 */

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  useSessionStore,
  useUnreadCount,
  type NotificationAudience,
} from '@snt/core';
import { BellIcon } from '../icons';
import { CountBadge } from '../primitives/Badge';
import { NotificationMenu } from './NotificationMenu';
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
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const banned = useSessionStore((state) => state.viewer?.standing === 'banned');
  // A guest has no list of their own: hidden while signed out.
  const className = [styles.bell, audience === 'user' ? styles.userBell : ''].filter(Boolean).join(' ');
  if (audience === 'user' && banned) {
    return (
      <span className={className} aria-disabled="true" aria-label="Notifications">
        <BellIcon size={22} fill="currentColor" />
      </span>
    );
  }
  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
  if (audience === 'user') {
    return (
      <>
        <button
          ref={button}
          type="button"
          className={className}
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((now) => !now)}
        >
          <BellIcon size={22} fill="currentColor" />
          <span className={styles.bellCount} aria-hidden>
            <CountBadge count={unread} />
          </span>
        </button>
        {open ? (
          <NotificationMenu anchor={button.current} href={href} onClose={() => setOpen(false)} />
        ) : null}
      </>
    );
  }
  return (
    <Link
      href={href}
      className={className}
      aria-label={label}
    >
      <BellIcon size={22} fill="currentColor" />
      <span className={styles.bellCount} aria-hidden>
        <CountBadge count={unread} />
      </span>
    </Link>
  );
}
