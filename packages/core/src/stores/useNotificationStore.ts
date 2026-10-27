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
  markAllRead: (audience: NotificationAudience) => void;
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
  markAllRead: (audience) => {
    const { notifications, readIds } = get();
    const ids = notifications
      .filter((n) => n.audience === audience && isUnread(n, readIds))
      .map((n) => n.id);
    if (!ids.length) return;
    set({ readIds: [...readIds, ...ids] });
    void api?.(ids).catch(() => undefined);
  },
}));

/** A list, newest first: a person's, or the store's. */
export function notificationsFor(
  notifications: AppNotification[],
  audience: NotificationAudience,
): AppNotification[] {
  return notifications.filter((n) => n.audience === audience);
}

/** The same, kept up to date. */
export function useNotifications(audience: NotificationAudience): AppNotification[] {
  const notifications = useNotificationStore((state) => state.notifications);
  return notificationsFor(notifications, audience);
}

/** Whether one is still unread. */
export function isUnread(n: AppNotification, readIds: string[]): boolean {
  return !n.read && !readIds.includes(n.id);
}

/** How many on a list are unread: the count on its bell. */
export function useUnreadCount(audience: NotificationAudience): number {
  const readIds = useNotificationStore((state) => state.readIds);
  return useNotifications(audience).filter((n) => isUnread(n, readIds)).length;
}
