/**
 * Contact reveals.
 *
 * The reveal is a button rather than text on the page, for three reasons:
 * attribution, seller retention, and scraper defence. No account is needed —
 * the only friction is a daily limit per device: a few numbers for a guest,
 * plenty for someone signed in. A casual buyer never meets it; someone
 * working through the listings has to join.
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
  /** How many reveals this device has used today, against the limit. */
  usedToday: number;
  reveal: (listingId: string, ownerId: string) => void;
  isRevealed: (listingId: string) => boolean;
  numberFor: (listingId: string) => string | undefined;
}

/** Numbers a guest may see in a day before being asked to sign in. */
export const GUEST_DAILY_REVEALS = 3;
/** The same for a signed-in user: enough that only a scraper reaches it. */
export const MEMBER_DAILY_REVEALS = 30;

/** How many more numbers this device may see today. */
export function revealsLeft(usedToday: number, signedIn: boolean): number {
  const limit = signedIn ? MEMBER_DAILY_REVEALS : GUEST_DAILY_REVEALS;
  return Math.max(0, limit - usedToday);
}

export const useRevealStore = create<RevealState>((set, get) => ({
  revealed: {},
  usedToday: 0,
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
}));
