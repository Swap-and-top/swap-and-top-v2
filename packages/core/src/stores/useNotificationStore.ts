/**
 * Notifications: the signed in person's list, and their store's in the
 * console, filled from the API once they are in (the web app's accountData);
 * empty for a guest. Tapping one reads it, and Mark all as read reads a
 * whole list, at once and then on the server (connectNotificationApi). The
 * unread count is on the bell.
 */

import { create } from 'zustand';
import type {
  AppNotification,
  NotificationAudience,
} from '../types/notification';

interface NotificationState {
  notifications: AppNotification[];
  /** Read on this visit, as well as those read before it. */
  readIds: string[];
  markRead: (id: string) => void;
  /** Every unread one on a list: a person's, or one store's. */
  markAllRead: (audience: NotificationAudience, storeId?: string) => void;
}

/** The server's side, connected by the web app: marks these read. */
export type NotificationApi = (ids: string[]) => Promise<void>;

let api: NotificationApi | null = null;

export function connectNotificationApi(connected: NotificationApi) {
  api = connected;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  readIds: [],
  markRead: (id) => {
    if (get().readIds.includes(id)) return;
    set((state) => ({ readIds: [...state.readIds, id] }));
    void api?.([id]).catch(() => undefined);
  },
  markAllRead: (audience, storeId) => {
    const { notifications, readIds } = get();
    const ids = notificationsFor(notifications, audience, storeId)
      .filter((n) => isUnread(n, readIds))
      .map((n) => n.id);
    if (!ids.length) return;
    set({ readIds: [...readIds, ...ids] });
    void api?.(ids).catch(() => undefined);
  },
}));

/** A list, newest first: a person's, or a store's (one store's, when its
    id is given; the sample ones carry none and show for any). */
export function notificationsFor(
  notifications: AppNotification[],
  audience: NotificationAudience,
  storeId?: string,
): AppNotification[] {
  return notifications.filter(
    (n) =>
      n.audience === audience &&
      (audience !== 'store' || !storeId || !n.storeId || n.storeId === storeId),
  );
}

/** The same, kept up to date. */
export function useNotifications(
  audience: NotificationAudience,
  storeId?: string,
): AppNotification[] {
  const notifications = useNotificationStore((state) => state.notifications);
  return notificationsFor(notifications, audience, storeId);
}

/** Whether one is still unread. */
export function isUnread(n: AppNotification, readIds: string[]): boolean {
  return !n.read && !readIds.includes(n.id);
}

/** How many on a list are unread: the count on its bell. */
export function useUnreadCount(audience: NotificationAudience, storeId?: string): number {
  const readIds = useNotificationStore((state) => state.readIds);
  return useNotifications(audience, storeId).filter((n) => isUnread(n, readIds)).length;
}
