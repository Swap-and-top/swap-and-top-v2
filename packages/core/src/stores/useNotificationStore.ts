/**
 * Which notifications have been read on this visit: tapping one reads it,
 * and Mark all as read reads a whole list. The unread count is on the bell.
 */

import { create } from 'zustand';
import { mockNotifications } from '../mock/notifications';
import type {
  AppNotification,
  NotificationAudience,
} from '../types/notification';

interface NotificationState {
  /** Read on this visit, as well as those read before it. */
  readIds: string[];
  markRead: (id: string) => void;
  markAllRead: (audience: NotificationAudience) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  readIds: [],
  markRead: (id) =>
    set((state) =>
      state.readIds.includes(id) ? state : { readIds: [...state.readIds, id] },
    ),
  markAllRead: (audience) =>
    set((state) => ({
      readIds: [
        ...new Set([
          ...state.readIds,
          ...notificationsFor(audience).map((n) => n.id),
        ]),
      ],
    })),
}));

/** A list, newest first: a person's, or the store's. */
export function notificationsFor(
  audience: NotificationAudience,
): AppNotification[] {
  return mockNotifications.filter((n) => n.audience === audience);
}

/** Whether one is still unread. */
export function isUnread(n: AppNotification, readIds: string[]): boolean {
  return !n.read && !readIds.includes(n.id);
}

/** How many on a list are unread: the count on its bell. */
export function useUnreadCount(audience: NotificationAudience): number {
  const readIds = useNotificationStore((state) => state.readIds);
  return notificationsFor(audience).filter((n) => isUnread(n, readIds)).length;
}
