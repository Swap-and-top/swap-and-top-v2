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

/**
 * The ways a seller can be reached, as they chose when posting: any of
 * calls, WhatsApp (both on their number), email, and Facebook Messenger.
 */
export type ContactWay = 'call' | 'whatsapp' | 'email' | 'messenger';

export interface ContactWays {
  /** The number, for calls — and WhatsApp, unless that has its own. */
  phone: string;
  /** A different number for WhatsApp, for someone who keeps it on another
      line. Most leave it empty, and WhatsApp uses `phone`. */
  whatsappPhone?: string;
  call: boolean;
  whatsapp: boolean;
  email?: string;
  /**
   * Their Messenger link (m.me/…). Signing in with Facebook does not give
   * it to us, so the seller pastes it in themselves.
   */
  messenger?: string;
}

/** A sample of each kind of choice. Obviously fake. */
const SAMPLE_WAYS: Record<string, Omit<ContactWays, 'phone'>> = {
  // Every way.
  'u-kopje': {
    call: true,
    whatsapp: true,
    email: 'sales@kopje.example',
    messenger: 'https://m.me/kopje.example',
  },
  // Calls, WhatsApp on a different line, and email.
  'u-tarisai': {
    call: true,
    whatsapp: true,
    whatsappPhone: '+263 71 234 5678',
    email: 'tarisai@example.com',
  },
  // WhatsApp only.
  'u-blessing': { call: false, whatsapp: true },
  // Calls only.
  'u-rudo': { call: true, whatsapp: false },
};

export function contactWaysFor(userId: string): ContactWays {
  return {
    phone: contactNumberFor(userId),
    ...(SAMPLE_WAYS[userId] ?? { call: true, whatsapp: true }),
  };
}

/** The number WhatsApp is on: its own, if they gave one. */
export function whatsappNumberOf(ways: ContactWays): string {
  return ways.whatsappPhone ?? ways.phone;
}

/** One reveal: which listing, whose, and which way. */
export interface ContactReveal {
  listingId: string;
  ownerId: string;
  way: ContactWay;
  at: number;
}

interface RevealState {
  /**
   * Listing id → the ways revealed on it. Each way is revealed on its own:
   * showing someone's number does not give away their email.
   */
  revealed: Record<string, ContactWay[]>;
  /**
   * Sellers whose details this device has seen today, against the limit. It
   * counts sellers' listings, not ways: looking at a seller's WhatsApp and
   * then their email is one, not two.
   */
  usedToday: number;
  /**
   * Every reveal, by way — what tells a seller how people reach them: how
   * many wanted their WhatsApp, their email, their Messenger.
   */
  events: ContactReveal[];
  reveal: (listingId: string, ownerId: string, way: ContactWay) => void;
  /** Whether anything on this listing has been revealed, or this one way. */
  isRevealed: (listingId: string, way?: ContactWay) => boolean;
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
  events: [],
  reveal: (listingId, ownerId, way) =>
    set((state) => {
      const shown = state.revealed[listingId] ?? [];
      if (shown.includes(way)) return state;
      return {
        revealed: { ...state.revealed, [listingId]: [...shown, way] },
        // A seller's first way revealed is what counts against the limit.
        usedToday: shown.length === 0 ? state.usedToday + 1 : state.usedToday,
        events: [
          ...state.events,
          { listingId, ownerId, way, at: Date.now() },
        ],
      };
    }),
  isRevealed: (listingId, way) => {
    const shown = get().revealed[listingId] ?? [];
    return way ? shown.includes(way) : shown.length > 0;
  },
}));
