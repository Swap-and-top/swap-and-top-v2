'use client';

/**
 * What an owner does to their listing (pause, mark sold, delete, relist),
 * saved through the API (PATCH /api/listings/{id}/status). The change shows
 * at once from the listing status store; if the API refuses it, it is put
 * back and they are told.
 */

import { toast } from 'sonner';
import { useListingStatusStore, type Listing, type ListingStatus } from '@snt/core';
import { refreshListing } from './refresh';
import { apiAsViewer } from './supabase';

export async function saveStatus(listing: Listing, next: ListingStatus): Promise<boolean> {
  const { changes, setStatus } = useListingStatusStore.getState();
  const before = changes[listing.id] ?? listing.status;
  setStatus(listing.id, next);
  const { error } = await apiAsViewer(`/listings/${encodeURIComponent(listing.id)}/status`, {
    method: 'PATCH',
    body: { status: next },
  });
  if (error) {
    setStatus(listing.id, before);
    toast.error(error);
    return false;
  }
  await refreshListing(listing.slug);
  return true;
}
