'use client';

/**
 * Loads the database's live listings as the app starts in the browser, for
 * everything that shows listings without a page to bring them
 * (useListingSource in @snt/core): the search panel, the offer form's own
 * items. Page by page from GET /api/listings, newest first, through
 * TanStack Query: tried again if the server cannot be reached, and read
 * again after five minutes, at the next page opened.
 */

import { useQuery } from '@tanstack/react-query';
import { rememberListings, useListingSource, type Listing } from '@snt/core';
import { publicGet } from '@/lib/query';

async function allLiveListings(): Promise<Listing[]> {
  const all: Listing[] = [];
  let cursor: string | undefined;
  // At most twenty pages of fifty: a thousand listings.
  for (let page = 0; page < 20; page += 1) {
    const query = new URLSearchParams({ limit: '50', ...(cursor ? { cursor } : {}) });
    const body = await publicGet<{ listings: Listing[]; nextCursor?: string }>(`/listings?${query}`);
    all.push(...body.listings);
    cursor = body.nextCursor;
    if (!cursor) break;
  }
  // Found by id too, wherever a listing is looked up (an offer card), and
  // where the search panel and the offer form read them.
  rememberListings(all);
  useListingSource.setState({ listings: all });
  return all;
}

export function LiveListingsLoader() {
  useQuery({
    queryKey: ['listings', 'live'],
    queryFn: allLiveListings,
    // A thousand listings: not read again each time the tab comes back.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return null;
}
