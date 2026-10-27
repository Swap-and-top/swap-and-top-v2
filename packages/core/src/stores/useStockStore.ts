/**
 * A dealer's stock: what the mock data holds, plus what the dealer has added
 * since, one at a time from Add stock or many at once from Bulk import.
 *
 * The mock listings are fixed, so new items are kept here, newest first, and
 * the console asks for the shop's stock through `useShopStock`. In the real
 * system each is a create on the listings endpoint (see docs/api/endpoints.md);
 * an import is the same create, once per row.
 */

import { create } from 'zustand';
import { getShopListings } from '../mock/listings';
import type { Shop } from '../types/shop';
import type {
  Category,
  Condition,
  ItemSpecs,
  Listing,
  SaleListing,
} from '../types/listing';
import { statusOf, useListingStatusStore } from './useListingStatusStore';
import { useSponsorStore, withPromotion } from './useSponsorStore';

/** What the dealer gives for one item, from the form or a row of a sheet. */
export interface NewStock {
  title: string;
  category: Category;
  condition?: Condition;
  /** Without one the item is kept as a draft: nothing is listed unpriced. */
  price?: number;
  specs?: ItemSpecs;
  /** How many of this model the shop holds. */
  quantity?: number;
  acceptsSwaps?: boolean;
  /** Photo URLs, in order. */
  images?: string[];
  /** Keep it as a draft even with a price. */
  draft?: boolean;
  /** For an item already listed: live, paused or sold, as chosen on the form. */
  status?: 'live' | 'paused' | 'sold';
}

interface StockState {
  /** Items the dealer has added, newest first. */
  added: SaleListing[];
  /** Listing id → the item as the dealer has since edited it. */
  edited: Record<string, SaleListing>;
  addStock: (items: SaleListing[]) => void;
  /** Keeps an edited item in place of what it was. */
  saveStock: (listing: SaleListing) => void;
}

export const useStockStore = create<StockState>((set) => ({
  added: [],
  edited: {},
  addStock: (items) => set((state) => ({ added: [...items, ...state.added] })),
  saveStock: (listing) =>
    set((state) =>
      state.added.some((item) => item.id === listing.id)
        ? {
            added: state.added.map((item) =>
              item.id === listing.id ? listing : item,
            ),
          }
        : { edited: { ...state.edited, [listing.id]: listing } },
    ),
}));

let made = 0;

/** A sale listing for the shop, as a new item is created. */
export function newStockListing(shop: Shop, input: NewStock): SaleListing {
  made += 1;
  const id = `l-new-${Date.now().toString(36)}-${made}`;
  const slug = `${input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${id.slice(-6)}`;
  const priced = input.price !== undefined && input.price > 0;

  return {
    id,
    slug,
    type: 'sale',
    // The shop's owner, as on the rest of its stock.
    ownerId: getShopListings(shop.id)[0]?.ownerId ?? `u-${shop.slug}`,
    shopId: shop.id,
    category: input.category,
    title: input.title,
    location: shop.location,
    status: priced && !input.draft ? 'live' : 'draft',
    createdAt: new Date().toISOString().slice(0, 10),
    expiresAt: '',
    postedLabel: 'Just now',
    contactChannels: ['whatsapp', 'call'],
    allowDealerOffers: true,
    viewCount: 0,
    revealCount: 0,
    promotion: 'organic',
    tags: [],
    item: {
      id: `${id}-item`,
      category: input.category,
      name: input.title,
      condition: input.condition,
      specs: input.specs ?? {},
      images: input.images ?? [],
      wanted: false,
    },
    price: priced ? input.price! : 0,
    negotiable: true,
    stockCount: input.quantity,
    acceptsSwaps: input.acceptsSwaps,
  };
}

/**
 * An item with the dealer's changes. It keeps its id, address, counts and
 * placement. A draft given a price goes live, unless kept as a draft; an item
 * already listed takes the status chosen on the form, or keeps its own.
 */
export function editedStockListing(
  listing: SaleListing,
  input: NewStock,
): SaleListing {
  const priced = input.price !== undefined && input.price > 0;
  const status =
    input.draft || !priced
      ? 'draft'
      : listing.status === 'draft'
        ? 'live'
        : (input.status ?? listing.status);

  return {
    ...listing,
    category: input.category,
    title: input.title,
    status,
    item: {
      ...listing.item,
      category: input.category,
      name: input.title,
      condition: input.condition,
      specs: input.specs ?? {},
      images: input.images ?? [],
    },
    price: priced ? input.price! : 0,
    stockCount: input.quantity,
    acceptsSwaps: input.acceptsSwaps,
  };
}

/**
 * The shop's stock now: what it has added, newest first, then the rest, each
 * with the status its owner has since given it, leaving out what was deleted.
 */
export function useShopStock(shopId: string): Listing[] {
  const added = useStockStore((state) => state.added);
  const edited = useStockStore((state) => state.edited);
  const changes = useListingStatusStore((state) => state.changes);
  const sponsorships = useSponsorStore((state) => state.sponsorships);

  return [
    ...added.filter((listing) => listing.shopId === shopId),
    ...getShopListings(shopId).map((listing) => edited[listing.id] ?? listing),
  ]
    .map((listing) => {
      const status = statusOf(listing, changes);
      const now = status === listing.status ? listing : { ...listing, status };
      // Sponsored while a sponsorship runs (see useSponsorStore).
      return withPromotion(now, sponsorships);
    })
    // Deleted (withdrawn) or taken down: no longer part of the stock.
    .filter(
      (listing) => listing.status !== 'withdrawn' && listing.status !== 'removed',
    );
}
