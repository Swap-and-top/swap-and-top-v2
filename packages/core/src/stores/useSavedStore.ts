/** Saved listings — the watchlist. */

import { create } from 'zustand';

interface SavedState {
  ids: string[];
  toggle: (listingId: string) => void;
  /** Puts a listing on the saved list or takes it off, whatever it was. */
  setSaved: (listingId: string, saved: boolean) => void;
  isSaved: (listingId: string) => boolean;
}

/** Tarisai's sample saved listings, loaded into the database by its seed.
    Other people's listings only: your own are under My listings. */
export const SAMPLE_SAVED = ['l-thinkpad-t480', 'l-iphone-11', 'l-rx-580'];

export const useSavedStore = create<SavedState>((set, get) => ({
  /** Filled from the API once someone is signed in (the web app's
      accountData); empty for a guest. */
  ids: [],
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

/** The server's side of saving, connected by the web app. Rejects when the
    save did not happen. */
export type SavedApi = (listingId: string, saved: boolean) => Promise<void>;

let api: SavedApi | null = null;

export function connectSavedApi(connected: SavedApi) {
  api = connected;
}

/** Tells the server; simply succeeds until the web app connects it. */
export async function persistSaved(listingId: string, saved: boolean): Promise<void> {
  await api?.(listingId, saved);
}

/**
 * Saves or unsaves a listing optimistically: the saved list changes straight
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
