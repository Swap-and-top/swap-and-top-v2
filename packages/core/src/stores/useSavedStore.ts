/** Saved listings — the watchlist. */

import { create } from 'zustand';

interface SavedState {
  ids: string[];
  toggle: (listingId: string) => void;
  /** Puts a listing on the wishlist or takes it off, whatever it was. */
  setSaved: (listingId: string, saved: boolean) => void;
  isSaved: (listingId: string) => boolean;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  /** Seeded to match the Saved artboard. */
  ids: ['l-thinkpad-t480', 'l-macbook-swap', 'l-rx-580'],
  toggle: (listingId) =>
    set((state) => ({
      ids: state.ids.includes(listingId)
        ? state.ids.filter((id) => id !== listingId)
        : [listingId, ...state.ids],
    })),
  setSaved: (listingId, saved) =>
    set((state) => {
      const without = state.ids.filter((id) => id !== listingId);
      return { ids: saved ? [listingId, ...without] : without };
    }),
  isSaved: (listingId) => get().ids.includes(listingId),
}));

/**
 * Tells the server a listing was saved or unsaved. There is no server yet:
 * this simply succeeds, so the screens around it can be built
 * the way they will work — change the wishlist at once, then confirm or undo
 * when this settles. When the API exists, its call goes here and nothing
 * else changes. It must reject when the save did not happen.
 */
export async function persistSaved(
  _listingId: string,
  _saved: boolean,
): Promise<void> {
  await Promise.resolve();
}

/**
 * Saves or unsaves a listing optimistically: the wishlist changes straight
 * away, and is put back as it was if the server refuses. Resolves once the
 * change is confirmed; rejects — after undoing it — if it is not.
 */
export async function saveOptimistically(
  listingId: string,
  saved: boolean,
): Promise<void> {
  const { setSaved } = useSavedStore.getState();
  setSaved(listingId, saved);
  try {
    await persistSaved(listingId, saved);
  } catch (error) {
    setSaved(listingId, !saved);
    throw error;
  }
}
