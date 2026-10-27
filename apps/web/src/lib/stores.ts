/**
 * Stores from the database, for the store page built on the server. Read
 * straight from the API's own code, as listings are (lib/listings.ts). If the
 * database cannot be reached, the mock stores stand in, with a warning.
 */

import { cache } from 'react';
import { getStoreBySlug, getStoreListings, mockStores, type Listing, type Store } from '@snt/core';
import { storeBySlug, storeSlugs } from '@snt/api/stores';

export const storeFor = cache(
  async (slug: string): Promise<{ store: Store; listings: Listing[] } | undefined> => {
    try {
      const found = await storeBySlug(slug);
      if (!found) return undefined;
      const { listings, ...store } = found;
      return { store: store as Store, listings: listings as unknown as Listing[] };
    } catch (error) {
      console.warn('A store from the database failed; showing the mock one.', error);
      const store = getStoreBySlug(slug);
      if (!store) return undefined;
      const listings = getStoreListings(store.id).filter((listing) => listing.status === 'live');
      return { store, listings };
    }
  },
);

export async function allStoreSlugs(): Promise<string[]> {
  try {
    return await storeSlugs();
  } catch {
    return mockStores.map((store) => store.slug);
  }
}
