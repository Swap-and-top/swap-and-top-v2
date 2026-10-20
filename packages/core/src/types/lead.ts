/**
 * Leads — demand seen from a dealer's side.
 *
 * A lead is not a separate record. It is a swap or request listing, matched
 * against a dealer's stock, with the match named explicitly. The match line is
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
  /** Stock item that satisfies the demand, if the dealer has one. */
  matchedStockId?: string;
  matchedStockLabel?: string;
  /** How much of the dealer's price the trade-in plus cash covers. */
  coversAmount?: number;
  isNew: boolean;
  receivedAt: string;
  area: string;
  /**
   * How the dealer was told of it: the channels the alert went out on, and
   * when. Absent if no alert was sent (alerts paused, or it did not match
   * the dealer's alert settings). Recorded by the backend as it sends.
   */
  alert?: { via: AlertChannel[]; at: string };
}

export type LeadTab = 'matching' | 'reveals' | 'offers';

/**
 * Someone revealed the shop's number on one of its listings: the "Number
 * reveals" tab of Leads. A reveal is the platform's evidence that it sent
 * the shop a customer, and three days later both sides are asked whether a
 * deal went through (see docs/features/deal-confirmation.md).
 */
export interface NumberReveal {
  id: string;
  /** Who revealed it. */
  userId: string;
  /** The shop's listing it was revealed on. */
  listingId: string;
  /** How they went on to make contact. */
  way: 'whatsapp' | 'call';
  /** Pre-formatted, as on listings. */
  atLabel: string;
  area: string;
  /**
   * Where the deal check stands. `waiting`: too soon to ask, `daysToAsk`
   * says when. `asked`: both were asked and the shop has not answered.
   * `confirmed`: both said yes, and it counts on the shop's record. A "no"
   * is never shown to the other side, so it has no state of its own here.
   */
  deal: 'waiting' | 'asked' | 'confirmed';
  daysToAsk?: number;
}
