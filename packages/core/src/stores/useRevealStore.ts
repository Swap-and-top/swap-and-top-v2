/**
 * Contact reveals.
 *
 * The reveal is a button rather than text on the page, for three reasons:
 * attribution, seller retention, and scraper defence. No account is needed —
 * the only friction is a per-device rate limit a normal buyer never notices.
 *
 * In the real system the reveal is a server action that records an event with
 * the listing, a device hash, the viewer's role and the promotion slot at the
 * time. Here it records locally so the flow can be walked.
 */

import { create } from 'zustand';

/** Obviously fake, sequential placeholders. Never real numbers. */
const PLACEHOLDER_NUMBERS: Record<string, string> = {
  'u-kopje': '+263 77 123 4567',
  'u-tarisai': '+263 77 234 5678',
  'u-rudo': '+263 77 345 6789',
  'u-blessing': '+263 77 456 7890',
};

const FALLBACK_NUMBER = '+263 77 000 0000';

/**
 * A user's contact number, for the one other place it is handed over: when
 * an offer is accepted, and the two people are put in touch. Placeholders
 * here; in the real system this too is a recorded, server-side action.
 */
export function contactNumberFor(userId: string): string {
  return PLACEHOLDER_NUMBERS[userId] ?? FALLBACK_NUMBER;
}

interface RevealState {
  /** Listing id → the number shown. */
  revealed: Record<string, string>;
  /** How many reveals this device has used, against the rate limit. */
  usedToday: number;
  dailyLimit: number;
  reveal: (listingId: string, ownerId: string) => void;
  isRevealed: (listingId: string) => boolean;
  numberFor: (listingId: string) => string | undefined;
  remaining: () => number;
}

export const useRevealStore = create<RevealState>((set, get) => ({
  revealed: {},
  usedToday: 0,
  /** Generous enough that a real buyer never notices it. */
  dailyLimit: 10,
  reveal: (listingId, ownerId) =>
    set((state) => {
      if (state.revealed[listingId]) return state;
      return {
        revealed: {
          ...state.revealed,
          [listingId]: PLACEHOLDER_NUMBERS[ownerId] ?? FALLBACK_NUMBER,
        },
        usedToday: state.usedToday + 1,
      };
    }),
  isRevealed: (listingId) => Boolean(get().revealed[listingId]),
  numberFor: (listingId) => get().revealed[listingId],
  remaining: () => Math.max(0, get().dailyLimit - get().usedToday),
}));
