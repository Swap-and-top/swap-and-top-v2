'use client';

/**
 * Console — Notifications: everything for the store, newest first, one list
 * (see NotificationList): new leads, offers on stock, replies to its offers,
 * deal checks to answer, the weekly summary, its subscription. Reached from
 * the bell in the console's header, or Notifications in its sidebar.
 */

import { currentStore, newLeadCount } from '@snt/core';
import { Button, ConsoleShell, useConsoleTarget } from '@snt/ui';
import {
  NotificationList,
  useMarkAllRead,
} from '@/components/notifications/NotificationList';
import styles from './page.module.css';

export default function ConsoleNotificationsPage() {
  // The store the console is open for: its own notifications only.
  const store = useConsoleTarget() ?? currentStore;
  const { unread, markAllRead } = useMarkAllRead('store', store.id);

  return (
    <ConsoleShell
      store={store}
      title="Notifications"
      meta="Everything for your store, newest first"
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
        <NotificationList audience="store" storeId={store.id} />
      </div>
    </ConsoleShell>
  );
}
