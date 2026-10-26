/**
 * Listing types.
 *
 * One shared `ListingBase` with per-type detail attached, exactly as
 * docs/features/listing-types.md describes. All four types are defined even
 * though only three ship, because retrofitting the shared shape is expensive.
 */

export type ListingType = 'sale' | 'swap' | 'request' | 'auction';

export type Category =
  | 'phones'
  | 'laptops'
  | 'desktops'
  | 'consoles'
  | 'parts'
  | 'accessories'
  /** Anything not covered yet: described in words, with no spec set. */
  | 'other';

/** The four conditions a seller picks from: new in its box, then used. */
export type Condition = 'boxed-new' | 'like-new' | 'good' | 'fair';

export type ListingStatus =
  | 'draft'
  | 'live'
  /** Taken down for now by its owner, who can bring it back. */
  | 'paused'
  | 'sold'
  | 'expired'
  | 'withdrawn'
  | 'removed';

/** Which way the cash flows in a swap, always from the poster's point of view. */
export type CashDirection = 'i-add' | 'they-add' | 'straight';

export type ContactChannel = 'whatsapp' | 'call' | 'email' | 'messenger' | 'sms';

/**
 * Who sees the poster's contact details. `everyone`: anyone who taps Show
 * contact. `offers`: nobody until the poster accepts their offer; people
 * offer first. Set by a toggle on any post: a sale with it on takes offers
 * as a sale that accepts swaps does.
 */
export type ContactShownTo = 'everyone' | 'offers';

/** Whether a listing currently occupies a paid slot. Recorded on every reveal. */
export type PromotionSlot = 'organic' | 'sponsored' | 'drop';

/**
 * A described device. Referenced by listings rather than embedded, because a
 * swap references two of them and a request may reference one as a trade-in.
 */
export interface Item {
  id: string;
  category: Category;
  name: string;
  brand?: string;
  model?: string;
  condition?: Condition;
  /** Free-text note. Surfaced prominently — hiding flaws produces failed meetings. */
  defects?: string;
  accessories?: string;
  /** Structured, filterable specs. Every key shown as a filter must be stored. */
  specs: ItemSpecs;
  /** Empty when the poster does not own the item (the "wants" side of a swap). */
  images: string[];
  /** True when this describes something wanted rather than owned. */
  wanted: boolean;
}

export interface ItemSpecs {
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  screen?: string;
  battery?: string;
  formFactor?: string;
  controllers?: string;
  partType?: string;
  capacity?: string;
  colour?: string;
  /** For something in Other: what it is, in the seller's own words. */
  details?: string;
}

/** Everything every listing carries, regardless of type. */
export interface ListingBase {
  id: string;
  /** Readable and immutable once published. Drives the public URL. */
  slug: string;
  type: ListingType;
  ownerId: string;
  /** Present only when the owner is a dealer. */
  shopId?: string;
  category: Category;
  title: string;
  location: string;
  status: ListingStatus;
  createdAt: string;
  expiresAt: string;
  /**
   * Pre-formatted age, e.g. "5h ago". Present only in this UI scaffold.
   *
   * Relative times are deliberately NOT computed at render: the server and the
   * client would produce different strings and React would report a hydration
   * mismatch. Replace this with a real formatter (and a client-only boundary)
   * once listings come from the API.
   */
  postedLabel: string;
  contactChannels: ContactChannel[];
  /**
   * The poster's choice to show their number to signed-in users only. Off by
   * default: the number is open to anyone, within the daily limit.
   */
  contactSignedInOnly?: boolean;
  /** Who sees the contact details. Missing means `everyone`. */
  contactShownTo?: ContactShownTo;
  /**
   * With `offers`: dealers may still see the details on the lead in their
   * console, before any offer is accepted. Off unless the poster ticks it.
   */
  contactToDealers?: boolean;
  /** Whether this may appear in dealer lead feeds. Defaults on. */
  allowDealerOffers: boolean;
  viewCount: number;
  revealCount: number;
  promotion: PromotionSlot;
  /** Tags such as `drop` for the weekly Friday Drop. */
  tags: string[];
}

export interface SaleListing extends ListingBase {
  type: 'sale';
  item: Item;
  price: number;
  negotiable: boolean;
  /** How many of this model the dealer holds. Dealers only. */
  stockCount?: number;
  /** Set when the price has been reduced since it was first published. */
  previousPrice?: number;
  /**
   * The seller takes a trade-in towards it: a buyer can swap something for
   * it, with cash on top. Shown on the listing, with a way to ask.
   */
  acceptsSwaps?: boolean;
}

export interface SwapListing extends ListingBase {
  type: 'swap';
  /** What the poster owns. Fully specified, with photos. */
  has: Item;
  /** What the poster wants. Specified loosely, never with photos. */
  wants: Item;
  cashDirection: CashDirection;
  /** Absent when `cashDirection` is `straight`. */
  cashAmount?: number;
  /**
   * The poster's cash is a ceiling, not a set amount: "I add up to $600".
   * Only with `i-add`. This is how someone who wants something and has
   * something to give says what they will spend.
   */
  cashUpTo?: boolean;
  offerCount: number;
}

export interface RequestListing extends ListingBase {
  type: 'request';
  wants: Item;
  /** Cash only. Someone with something to trade in posts a swap instead. */
  budget: number;
  responseCount: number;
}

/** Specified so the shared shape can hold it. Not built — see docs/features/auctions.md. */
export interface AuctionListing extends ListingBase {
  type: 'auction';
  item: Item;
  startingPrice: number;
  reservePrice?: number;
  closesAt: string;
  currentBid?: number;
  bidCount: number;
  extensionCount: number;
}

export type Listing =
  | SaleListing
  | SwapListing
  | RequestListing
  | AuctionListing;

/** Anything that expresses demand: a request, or a swap seen from its wants side. */
export type DemandListing = SwapListing | RequestListing;

/**
 * A listing that takes offers: a swap or a request always, and a sale when
 * its seller takes swaps (a trade-in offer towards it).
 */
export type OfferableListing = DemandListing | SaleListing;

export function takesOffers(listing: Listing): listing is OfferableListing {
  if (listing.type === 'swap' || listing.type === 'request') return true;
  // A sale takes offers where the price moves, where it takes swaps, or
  // where the seller shares their number only after accepting an offer.
  return (
    listing.type === 'sale' &&
    (listing.negotiable ||
      Boolean(listing.acceptsSwaps) ||
      listing.contactShownTo === 'offers')
  );
}

/** Whether a listing takes an offer of just cash: a sale whose price is
    negotiable, or whose seller shares their number only after accepting an
    offer. A fixed price sale that takes swaps asks for a swap; a swap or a
    Wanted listing asks for an item. */
export function takesCashOffers(listing: Listing): boolean {
  return (
    listing.type === 'sale' &&
    (listing.negotiable || listing.contactShownTo === 'offers')
  );
}

/** Whether a listing keeps its contact details back until an offer is
    accepted. */
export function contactAfterOffer(listing: Listing): boolean {
  return listing.contactShownTo === 'offers';
}

/** Whether a dealer may see the poster's details on a lead, before any
    offer of theirs is accepted. */
export function contactOpenToDealers(listing: Listing): boolean {
  return !contactAfterOffer(listing) || Boolean(listing.contactToDealers);
}

export const isSale = (l: Listing): l is SaleListing => l.type === 'sale';
export const isSwap = (l: Listing): l is SwapListing => l.type === 'swap';
export const isRequest = (l: Listing): l is RequestListing =>
  l.type === 'request';
export const isAuction = (l: Listing): l is AuctionListing =>
  l.type === 'auction';
export const isDemand = (l: Listing): l is DemandListing =>
  l.type === 'swap' || l.type === 'request';

export const CATEGORY_LABELS: Record<Category, string> = {
  phones: 'Phones',
  laptops: 'Laptops',
  desktops: 'Desktops',
  consoles: 'Consoles',
  parts: 'Parts',
  accessories: 'Accessories',
  other: 'Other',
};

export const CONDITION_LABELS: Record<Condition, string> = {
  'boxed-new': 'Boxed new',
  'like-new': 'Used like new',
  good: 'Used good',
  fair: 'Used fair',
};
