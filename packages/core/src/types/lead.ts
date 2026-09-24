/**
 * Leads — demand seen from a dealer's side.
 *
 * A lead is not a separate record. It is a swap or request listing, matched
 * against a dealer's stock, with the match named explicitly. The match line is
 * what turns a notification into a tool.
 */

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
}

export type LeadTab = 'matching' | 'reveals' | 'offers';
