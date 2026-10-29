'use client';

/**
 * What an owner does to their listing (pause, mark sold, delete, relist),
 * saved through the API (PATCH /api/listings/{id}/status) as a TanStack Query
 * mutation. The change shows at once from the listing status store; if the
 * API refuses it, it is put back and they are told. Once saved, their own
 * listings and their store's stock are read again.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useListingStatusStore, type Listing, type ListingStatus } from '@snt/core';
import { stockKey } from '@/app/console/stock/useConsoleStock';
import { apiSend } from './query';
import { refreshListing } from './refresh';

interface Change {
  listing: Listing;
  next: ListingStatus;
}

/** Saves a listing's new status; resolves true once saved, false if it was
    refused (already put back, and said). */
export function useSaveStatus(): (listing: Listing, next: ListingStatus) => Promise<boolean> {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ listing, next }: Change) => {
      await apiSend(`/listings/${encodeURIComponent(listing.id)}/status`, 'PATCH', { status: next });
      await refreshListing(listing.slug);
    },
    // At once, before the API answers; what it was is kept to put back.
    onMutate: ({ listing, next }: Change) => {
      const { changes, setStatus } = useListingStatusStore.getState();
      const before = changes[listing.id] ?? listing.status;
      setStatus(listing.id, next);
      return { before };
    },
    onError: (error, { listing }, context) => {
      if (context) useListingStatusStore.getState().setStatus(listing.id, context.before);
      toast.error(error.message || 'We could not change it. Try again in a minute.');
    },
    onSuccess: (_data, { listing }) => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      if (listing.storeId) void queryClient.invalidateQueries({ queryKey: stockKey(listing.storeId) });
    },
  });
  return (listing, next) =>
    mutation.mutateAsync({ listing, next }).then(
      () => true,
      () => false,
    );
}
