/**
 * Lead alerts — a dealer's settings for the message they get the moment
 * someone posts demand that matches what they sell. The paid product: see
 * docs/features/notifications.md ("Matching demand alert").
 *
 * This is the whole contract the backend works to. It stores one of these
 * per shop, and for every new swap or request decides, from it, whether to
 * alert the shop and on which channels, then records how it did on the lead
 * (see Lead.alert).
 */

import type { Category } from './listing';

/** Where an alert is sent. In the app is always on: it is the record. */
export type AlertChannel = 'whatsapp' | 'inApp';

/** What counts as a match. */
export type AlertMatch =
  /** Demand for items like the ones in the shop's live stock. */
  | 'stock'
  /** Any demand in the chosen categories, stock or not: for sourcing. */
  | 'categories';

export interface LeadAlertSettings {
  /** Off while paused: nothing is sent, leads still collect in the app. */
  enabled: boolean;
  whatsapp: {
    on: boolean;
    /** The number alerts go to, as the dealer typed it. */
    number: string;
    /** Proved by a one time code. Nothing goes to an unconfirmed number. */
    confirmed: boolean;
  };
  match: AlertMatch;
  /** Used when `match` is 'categories'. */
  categories: Category[];
  /** Swaps as well as plain requests. A swap comes with an item offered in
      exchange, so it is usually the bigger lead. */
  includeSwaps: boolean;
  /** Only demand with at least this budget (requests) or this much cash on
      top (swaps). Null for any. */
  minBudget: number | null;
  /** No WhatsApp between these times (24 hour "HH:MM", the shop's time);
      alerts still arrive in the app, and the WhatsApp goes out after. */
  quietHours: { on: boolean; from: string; to: string };
  /** When the last alert went out, for the status line. Set by the backend. */
  lastSentLabel: string | null;
}

/** How the alerts stand, for the chip at the top of Leads. */
export type LeadAlertStatus =
  /** Sending. */
  | 'on'
  /** Switched off by the dealer. */
  | 'paused'
  /** On, but something must be done first: WhatsApp unconfirmed, or no
      category chosen. */
  | 'setup';

export function leadAlertStatus(settings: LeadAlertSettings): LeadAlertStatus {
  if (!settings.enabled) return 'paused';
  if (settings.whatsapp.on && !settings.whatsapp.confirmed) return 'setup';
  if (settings.match === 'categories' && settings.categories.length === 0) {
    return 'setup';
  }
  return 'on';
}

/** The channels alerts go out on now: in the app always, WhatsApp if set. */
export function activeAlertChannels(settings: LeadAlertSettings): AlertChannel[] {
  const ready = settings.whatsapp.on && settings.whatsapp.confirmed;
  return ready ? ['whatsapp', 'inApp'] : ['inApp'];
}
