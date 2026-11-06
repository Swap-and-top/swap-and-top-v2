/**
 * Who posted a listing and the store it was posted as, for cards and listing
 * pages: from the listing itself when it came from the API (`poster`,
 * `store`), else from the mock users and stores, as the mock listings have
 * neither.
 */

import type { Listing } from '../types/listing';
import type { Store } from '../types/store';
import type { User } from '../types/user';
import { getStore } from './stores';
import { getUser } from './users';

export function posterOf(listing: Listing): User | undefined {
  const poster = listing.poster;
  if (!poster) return getUser(listing.ownerId);
  return {
    id: poster.id,
    displayName: poster.displayName,
    // Only someone with a verified phone can post.
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: listing.location,
    joinedAt: poster.joinedAt,
    confirmedDeals: poster.confirmedDeals,
    hasUpheldReports: poster.hasUpheldReports,
    storeId: listing.storeId,
  };
}

export function storeOf(listing: Listing): Store | undefined {
  const store = listing.store;
  if (!store) return getStore(listing.storeId);
  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    initials: store.initials,
    logo: store.logo,
    description: '',
    location: listing.location,
    openingHours: '',
    verified: store.verified,
    stockCount: store.stockCount,
    confirmedDeals: 0,
    // Not measured yet: "< 1h", as on the store's page.
    replyHours: 1,
    joinedAt: '',
  };
}
