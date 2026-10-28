'use client';

/**
 * Loads the database's live listings once, as the app starts in the
 * browser, for everything that shows listings without a page to bring them
 * (useListingSource in @snt/core): the search panel, the offer form's own
 * items. Page by page from GET /api/listings, newest first.
 */

import { useEffect } from 'react';
import { rememberListings, useListingSource, type Listing } from '@snt/core';

export function LiveListingsLoader() {
  useEffect(() => {
    let current = true;
    void (async () => {
      const all: Listing[] = [];
      let cursor: string | undefined;
      // At most twenty pages of fifty: a thousand listings.
      for (let page = 0; page < 20; page += 1) {
        const query = new URLSearchParams({ limit: '50', ...(cursor ? { cursor } : {}) });
        const response = await fetch(`/api/listings?${query}`).catch(() => null);
        if (!response?.ok) return;
        const body = (await response.json()) as { listings: Listing[]; nextCursor?: string };
        all.push(...body.listings);
        cursor = body.nextCursor;
        if (!cursor) break;
      }
      // Found by id too, wherever a listing is looked up (an offer card).
      rememberListings(all);
      if (current) useListingSource.setState({ listings: all });
    })();
    return () => {
      current = false;
    };
  }, []);
  return null;
}
