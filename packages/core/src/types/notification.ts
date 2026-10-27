/**
 * Notifications — the in-app record of everything worth knowing (see
 * docs/features/notifications.md). One list for a person, on their
 * Notifications page; one for a shop, in the dealer console. Each entry is a
 * short line, a time, and a way to the thing it is about. There is no
 * messaging: people talk on WhatsApp or the phone.
 */

/** Whose list it is on: a person's, or a shop's in the console. */
export type NotificationAudience = 'user' | 'shop';

/** What it is about, which picks its icon. */
export type NotificationKind =
  | 'offer'
  | 'offer-reply'
  | 'deal'
  | 'lead'
  | 'reveal'
  | 'listing'
  | 'saved'
  | 'sponsor'
  | 'account';

export interface AppNotification {
  id: string;
  audience: NotificationAudience;
  kind: NotificationKind;
  /** One short line, in plain words. */
  text: string;
  /** Pre-formatted age, as on listings. */
  atLabel: string;
  /** Where a tap goes: the offer, the deal check, the lead. */
  href: string;
  /** Read before this visit. Tapping one, or Mark all as read, reads it. */
  read: boolean;
}
