'use client';

/**
 * Console — Notifications: everything for the shop, newest first, one list
 * (see NotificationList): new leads, offers on stock, replies to its offers,
 * deal checks to answer, the weekly summary, its subscription. Reached from
 * the bell in the console's header, or Notifications in its sidebar.
 */

import { currentShop, newLeadCount } from '@snt/core';
import { Button, ConsoleShell } from '@snt/ui';
import {
  NotificationList,
  useMarkAllRead,
} from '@/components/notifications/NotificationList';
import styles from './page.module.css';

export default function ConsoleNotificationsPage() {
  const { unread, markAllRead } = useMarkAllRead('shop');

  return (
    <ConsoleShell
      shop={currentShop}
      title="Notifications"
      meta="Everything for your shop, newest first"
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!unread}
            onClick={markAllRead}
          >
            Mark all as read
          </Button>
        </div>
      }
    >
      <div className={styles.column}>
        <NotificationList audience="shop" />
      </div>
    </ConsoleShell>
  );
}
