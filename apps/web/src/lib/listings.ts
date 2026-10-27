/**
 * Listings from the database, for the pages built on the server (the feed,
 * a listing page). Read straight from the API's own code, not over HTTP, so
 * a page can be built ahead of time. The shapes are @snt/core's, as the API
 * promises (apps/api/src/schemas.ts).
 *
 * If the database cannot be reached (a build with no DATABASE_URL), the mock
 * listings stand in, with a warning, so the site still builds.
 */

import { cache } from 'react';
import { getListingBySlug, mockListings, type Listing } from '@snt/core';
import { listingBySlug, liveListings } from '@snt/api/listings';

export const feedListings = cache(async (): Promise<Listing[]> => {
  try {
    return (await liveListings()) as unknown as Listing[];
  } catch (error) {
    console.warn('Listings from the database failed; showing the mock ones.', error);
    return mockListings.filter((listing) => listing.status === 'live');
  }
});

export const listingFor = cache(async (slug: string): Promise<Listing | undefined> => {
  try {
    return (await listingBySlug(slug)) as unknown as Listing | undefined;
  } catch (error) {
    console.warn('A listing from the database failed; showing the mock one.', error);
    return getListingBySlug(slug);
  }
});
