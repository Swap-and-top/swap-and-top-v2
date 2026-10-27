/**
 * Leads — demand seen from a store's side.
 *
 * A lead is not a separate record. It is a swap or request listing, matched
 * against a store's stock, with the match named explicitly. The match line is
 * what turns a notification into a tool.
 */

import type { AlertChannel } from './leadAlerts';
import type { DemandListing } from './listing';
import type { User } from './user';

export interface Lead {
  id: string;
  /** The demand listing this lead is built from. */
  demand: DemandListing;
  requester: User;
  /** Stock item that satisfies the demand, if the store has one. */
  matchedStockId?: string;
  matchedStockLabel?: string;
  /** How much of the store's price the trade-in plus cash covers. */
  coversAmount?: number;
  isNew: boolean;
  receivedAt: string;
  area: string;
  /**
   * How the store was told of it: the channels the alert went out on, and
   * when. Absent if no alert was sent (alerts paused, or it did not match
   * the store's alert settings). Recorded by the backend as it sends.
   */
  alert?: { via: AlertChannel[]; at: string };
}

export type LeadTab = 'matching' | 'reveals';

/** The console's Offers page: offers on the store's stock, or ones it sent. */
export type ConsoleOffersTab = 'received' | 'sent';

/**
 * Someone revealed the store's number on one of its listings: the "Number
 * reveals" tab of Leads. A reveal is the platform's evidence that it sent
 * the store a customer, and three days later both sides are asked whether a
 * deal went through (see docs/features/deal-confirmation.md).
 */
export interface NumberReveal {
  id: string;
  /** Who revealed it. Shown to the store only once they say a deal went
      through; until then the row says "Someone in" their area. */
  userId: string;
  /** The store's listing it was revealed on. */
  listingId: string;
  /** How they went on to make contact. */
  way: 'whatsapp' | 'call';
  /** Pre-formatted, as on listings. */
  atLabel: string;
  area: string;
  /**
   * Where the deal check stands. The person who revealed is asked first;
   * the store only once they say yes. `waiting`: they have not been asked
   * yet (`daysToAsk` says when) or have not said yes. `asked`: they said
   * yes and the store has not answered.
   * `confirmed`: both said yes, and it counts on the store's record. A "no"
   * is never shown to the other side, so it has no state of its own here.
   */
  deal: 'waiting' | 'asked' | 'confirmed';
  daysToAsk?: number;
  /** The deal check the store answers, once it is asked. */
  dealId?: string;
}
