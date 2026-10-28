'use client';

/**
 * The Store console's stock, from the API (GET /api/stores/{id}/stock):
 * everything the store has listed and not deleted, in every state. A status
 * changed here shows at once (the listing status store, as on My listings),
 * and a boost marks it Sponsored. Null until it has loaded.
 */

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  statusOf,
  useListingStatusStore,
  useSponsorStore,
  withPromotion,
  type Listing,
} from '@snt/core';
import { apiAsViewer } from '@/lib/supabase';

export function useConsoleStock(storeId: string | undefined): Listing[] | null {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const changes = useListingStatusStore((state) => state.changes);
  const sponsorships = useSponsorStore((state) => state.sponsorships);

  useEffect(() => {
    if (!storeId) return;
    let gone = false;
    void apiAsViewer<{ listings: Listing[] }>(`/stores/${encodeURIComponent(storeId)}/stock`, {
      method: 'GET',
    }).then(
      ({ data, error }) => {
        if (gone) return;
        if (error) toast.error(error);
        setListings(data?.listings ?? []);
      },
    );
    return () => {
      gone = true;
    };
  }, [storeId]);

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
