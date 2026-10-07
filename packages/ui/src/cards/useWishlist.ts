'use client';

/**
 * useWishlist — whether a listing is on the wishlist, and the one way to put
 * it there or take it off, wherever the star appears.
 *
 * Optimistic: the star changes at once, before the server has answered. A
 * green toast confirms it once it has; if the save fails the star goes back
 * and a red toast says so.
 */

import { toast } from 'sonner';
import { saveOptimistically, useSavedStore } from '@snt/core';

export function useWishlist(listingId: string) {
  const saved = useSavedStore((state) => state.ids.includes(listingId));

  async function toggleSaved() {
    const next = !saved;
    try {
      await saveOptimistically(listingId, next);
      toast.success(next ? 'Added to your wishlist' : 'Removed from your wishlist');
    } catch {
      toast.error(
        next
          ? 'Could not add this to your wishlist. Try again.'
          : 'Could not remove this from your wishlist. Try again.',
      );
    }
  }

  return { saved, toggleSaved };
}
