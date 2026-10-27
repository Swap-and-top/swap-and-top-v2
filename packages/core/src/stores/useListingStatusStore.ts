/**
 * What owners have done to their listings: marked sold, paused, deleted,
 * relisted.
 *
 * The mock listings are fixed, so a change is kept here, over the top of a
 * listing's own status, and everything that shows listings asks for the
 * status through `statusOf` or `useLiveListings`. In the real system each is
 * an owner-only write (see docs/api/endpoints.md): mark sold, delete (which
 * withdraws, never a hard delete), relist. Pause is ours: a withdrawal the
 * owner can bring back.
 */

import { create } from 'zustand';
import { mockListings } from '../mock/listings';
import type { Listing, ListingStatus } from '../types/listing';
import { useSponsorStore, withPromotion } from './useSponsorStore';

interface ListingStatusState {
  /** Listing id → the status its owner has since given it. */
  changes: Record<string, ListingStatus>;
  setStatus: (listingId: string, status: ListingStatus) => void;
}

export const useListingStatusStore = create<ListingStatusState>((set) => ({
  changes: {},
  setStatus: (listingId, status) =>
    set((state) => ({ changes: { ...state.changes, [listingId]: status } })),
}));

/**
 * The database's live listings, loaded once in the browser by the web app
 * (LiveListingsLoader) for everything that shows listings without a page of
 * its own to bring them: the search panel, the offer form's own items.
 * Null until they arrive.
 */
export const useListingSource = create<{ listings: Listing[] | null }>(() => ({
  listings: null,
}));

/** A listing's status now: its owner's change, or its own. */
export function statusOf(
  listing: Listing,
  changes: Record<string, ListingStatus>,
): ListingStatus {
  return changes[listing.id] ?? listing.status;
}

/** The same, kept up to date as the owner changes it. */
export function useListingStatus(listing: Listing): ListingStatus {
  const changes = useListingStatusStore((state) => state.changes);
  return statusOf(listing, changes);
}

/**
 * Only live listings appear in the feed, in search, or in the sitemap: the
 * live ones, with what owners have since paused, sold or relisted taken
 * into account, and each one's sponsored slot as it stands now. `from` is
 * the listings to start with where a page has them from the server (the
 * feed, Wanted, search); otherwise the database's live listings as the app
 * loaded them (useListingSource), or the mock ones until they arrive.
 */
export function useLiveListings(from?: Listing[]): Listing[] {
  const changes = useListingStatusStore((state) => state.changes);
  const sponsorships = useSponsorStore((state) => state.sponsorships);
  const source = useListingSource((state) => state.listings);
  return (from ?? source ?? mockListings)
    .filter((listing) => statusOf(listing, changes) === 'live')
    .map((listing) => withPromotion(listing, sponsorships));
}
