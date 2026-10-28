/**
 * Offers.
 *
 * An offer is a structured reply to demand — a swap or a request: "I have
 * this; here is what I am putting forward, and the cash." It is not binding
 * and not escrowed. It opens a conversation the two people then finish
 * themselves, on WhatsApp or the phone. See docs/features/swap-and-top.md.
 */

import type { ContactWay } from '../stores/useRevealStore';
import type { Condition } from './listing';

export type OfferState = 'pending' | 'accepted' | 'declined' | 'withdrawn';

/**
 * Who puts cash in, if anyone. "Owner" is the person whose listing it is;
 * "offerer" the person replying to it. On a plain request the owner pays the
 * offerer's price, so that is `owner` too.
 */
export type OfferCashFrom = 'owner' | 'offerer' | 'none';

/** What the offerer is putting forward. */
export interface OfferItem {
  /** Set when it is one of the offerer's own listings. */
  listingId?: string;
  name: string;
  condition?: Condition;
}

export interface Offer {
  id: string;
  /** The swap or request this replies to. */
  listingId: string;
  fromUserId: string;
  /** Set when it was sent as a store, by its owner or staff. */
  fromStoreId?: string;
  /**
   * What is put forward. Missing on a cash offer: just a price, on a sale
   * whose poster shares their number only after accepting an offer.
   */
  item?: OfferItem;
  cashAmount: number;
  cashFrom: OfferCashFrom;
  message?: string;
  /**
   * How the offerer can be reached, chosen from the ways on their account
   * when they sent it. Shown to the owner only once the offer is accepted.
   * Missing on older offers, which then use every way they have.
   */
  reachOn?: ContactWay[];
  /** Once accepted, from the server: how to reach the other side. */
  contact?: { phone: string; call: boolean; whatsapp: boolean };
  state: OfferState;
  /** Pre-formatted age, as on listings — see `ListingBase.postedLabel`. */
  sentLabel: string;
  /**
   * True for the sample offers the listing's own count already includes, so
   * they are not counted twice. Gone once counts come from the server.
   */
  counted?: boolean;
}

/** What the offer form produces. */
export type OfferDraft = Pick<
  Offer,
  'listingId' | 'item' | 'cashAmount' | 'cashFrom' | 'message' | 'reachOn'
>;
