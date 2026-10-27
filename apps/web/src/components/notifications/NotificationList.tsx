'use client';

/**
 * A list of notifications, newest first: a person's on their Notifications
 * page, or the store's in the console. One white card; each row its kind's
 * icon on a pale tile, one short line, the time, and a blue dot while it is
 * unread. A tap reads it and goes to what it is about.
 */

import Link from 'next/link';
import {
  isUnread,
  notificationsFor,
  useNotificationStore,
  type NotificationAudience,
  type NotificationKind,
} from '@snt/core';
import {
  BellIcon,
  BinocularsIcon,
  CashHandIcon,
  CheckIcon,
  ClockIcon,
  MegaphoneIcon,
  SaveStarIcon,
  ShieldCheckIcon,
  TrendIcon,
} from '@snt/ui/icons';
import styles from './NotificationList.module.css';

const ICON: Record<NotificationKind, React.ReactNode> = {
  offer: <CashHandIcon size={18} filled={false} />,
  'offer-reply': <CheckIcon size={18} />,
  deal: <ShieldCheckIcon size={18} />,
  lead: <BinocularsIcon size={18} />,
  reveal: <TrendIcon size={18} />,
  listing: <ClockIcon size={18} />,
  saved: <SaveStarIcon size={18} />,
  sponsor: <MegaphoneIcon size={18} weight={1.9} />,
  account: <BellIcon size={18} />,
};

export function NotificationList({
  audience,
}: {
  audience: NotificationAudience;
}) {
  const readIds = useNotificationStore((state) => state.readIds);
  const markRead = useNotificationStore((state) => state.markRead);
  const list = notificationsFor(audience);

  if (list.length === 0) {
    return (
      <p className={styles.none}>
        Nothing yet. Offers, deal checks and anything else worth knowing will
        appear here.
      </p>
    );
  }

  return (
    <ol className={styles.list}>
      {list.map((n) => {
        const unread = isUnread(n, readIds);
        return (
          <li key={n.id}>
            <Link
              href={n.href}
              className={[styles.row, unread ? styles.unread : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => markRead(n.id)}
            >
              <span
                className={[
                  styles.icon,
                  n.kind === 'lead' ? styles.iconWanted : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden
              >
                {ICON[n.kind]}
              </span>
              <span className={styles.body}>
                <span className={styles.text}>{n.text}</span>
                <span className={styles.when}>{n.atLabel}</span>
              </span>
              {unread ? (
                <span className={styles.dot} aria-label="Unread" />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** "Mark all as read", or nothing to do when every one is read. */
export function useMarkAllRead(audience: NotificationAudience) {
  const readIds = useNotificationStore((state) => state.readIds);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const unread = notificationsFor(audience).some((n) => isUnread(n, readIds));
  return { unread, markAllRead: () => markAllRead(audience) };
}
