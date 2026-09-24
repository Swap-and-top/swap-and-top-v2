/** Saved listings — the watchlist. */

import { create } from 'zustand';

interface SavedState {
  ids: string[];
  toggle: (listingId: string) => void;
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
  isSaved: (listingId) => get().ids.includes(listingId),
}));
