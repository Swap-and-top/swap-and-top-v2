'use client';

/**
 * Notifications: everything worth knowing, newest first, one list (see
 * NotificationList). Reached from the bell in the header. A store has its
 * own, in the console.
 */

import {
  AppHeader,
  Button,
  Screen,
  ScreenBody,
  SignInGate,
} from '@snt/ui';
import {
  NotificationList,
  useMarkAllRead,
} from '@/components/notifications/NotificationList';
import styles from './page.module.css';

export default function NotificationsPage() {
  const { unread, markAllRead } = useMarkAllRead('user');

  return (
    <Screen>
      <AppHeader>
        <div className={styles.head}>
          <h1 className={styles.title}>Notifications</h1>
          <Button
            variant="secondary"
            size="sm"
            disabled={!unread}
            onClick={markAllRead}
          >
            Mark all as read
          </Button>
        </div>
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          <NotificationList audience="user" />
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
