'use client';

/**
 * The Store console's stock, from the API (GET /api/stores/{id}/stock):
 * everything the store has listed and not deleted, in every state. A status
 * changed here shows at once (the listing status store, as on My listings),
 * and a boost marks it Sponsored. Null until it has loaded; empty, with the
 * reason in a toast, when it cannot be (no store pass, say). Through
 * TanStack Query, so the screens that use it share one request.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  statusOf,
  useListingStatusStore,
  useSponsorStore,
  withPromotion,
  type Listing,
} from '@snt/core';
import { apiGet } from '@/lib/query';

/** The stock's query, to refresh it after a change. */
export const stockKey = (storeId: string | undefined) => ['store', storeId, 'stock'] as const;

export function useConsoleStock(storeId: string | undefined): Listing[] | null {
  const query = useQuery({
    queryKey: stockKey(storeId),
    queryFn: () =>
      apiGet<{ listings: Listing[] }>(`/stores/${encodeURIComponent(storeId!)}/stock`).then((data) => data.listings),
    enabled: Boolean(storeId),
    meta: { toast: true },
  });
  const listings = query.data ?? (query.isError ? [] : null);
  const changes = useListingStatusStore((state) => state.changes);
  const sponsorships = useSponsorStore((state) => state.sponsorships);

  return useMemo(
    () =>
      listings
        ?.map((listing) => {
          const status = statusOf(listing, changes);
          return withPromotion(status === listing.status ? listing : { ...listing, status }, sponsorships);
        })
        // Deleted here: gone from the stock at once.
        .filter((listing) => listing.status !== 'withdrawn' && listing.status !== 'removed') ?? null,
    [listings, changes, sponsorships],
  );
}
