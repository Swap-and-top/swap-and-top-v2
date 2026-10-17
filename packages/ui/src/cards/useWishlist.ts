'use client';

/**
 * useWishlist — whether a listing is on the wishlist, and the one way to put
 * it there or take it off, wherever the star appears.
 *
 * Optimistic: the star changes at once, before the server has answered. A
 * green toast confirms it once it has; if the save fails the star goes back
 * and a red toast says so.
 *
 * A wishlist needs an account. A guest who taps the star is asked to sign in,
 * and the listing is saved once they have.
 */

import { toast } from 'sonner';
import {
  requireSignIn,
  saveOptimistically,
  useSavedStore,
  useSessionStore,
} from '@snt/core';

export function useWishlist(listingId: string) {
  const signedIn = useSessionStore((state) => state.signedIn);
  const inList = useSavedStore((state) => state.ids.includes(listingId));
  // A wishlist belongs to an account: a guest has none, so no star is filled.
  const saved = signedIn && inList;

  /** Saving needs an account; a guest is asked to sign in, then it saves. */
  function toggleSaved() {
    requireSignIn('Sign in to save listings.', () => {
      void toggle(!saved);
    });
  }

  async function toggle(next: boolean) {
    try {
      await saveOptimistically(listingId, next);
      toast.success(next ? 'Saved' : 'Removed from saved');
    } catch {
      toast.error(
        next
          ? 'Could not save this. Try again.'
          : 'Could not remove this from saved. Try again.',
      );
    }
  }

  return { saved, toggleSaved };
}
