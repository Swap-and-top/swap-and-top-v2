'use client';

/**
 * NotificationMenu: the bell's drop down in the marketplace header (see
 * HeaderMenu): the newest five notifications, in the same rows as the
 * Notifications page with no icons, and See all notifications.
 */

import { useUnreadCount } from '@snt/core';
import { BellIcon } from '../icons';
import { HeaderMenu } from './HeaderMenu';
import { NotificationList } from './NotificationList';
import styles from './NotificationMenu.module.css';

/** How many it shows before See all notifications. */
const SHOWN = 5;

export function NotificationMenu({
  anchor,
  href,
  onClose,
}: {
  /** The bell it drops from. */
  anchor: HTMLElement | null;
  /** The Notifications page. */
  href: string;
  onClose: () => void;
}) {
  const unread = useUnreadCount('user');
  return (
    <HeaderMenu
      anchor={anchor}
      title="Notifications"
      icon={<BellIcon size={18} />}
      unread={unread}
      href={href}
      allLabel="See all notifications"
      onClose={onClose}
    >
      {(close) => (
        <NotificationList
          audience="user"
          limit={SHOWN}
          onNavigate={close}
          icons={false}
          className={styles.rows}
        />
      )}
    </HeaderMenu>
  );
}
