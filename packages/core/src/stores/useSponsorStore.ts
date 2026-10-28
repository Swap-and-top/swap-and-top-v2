/**
 * Sponsored slots: which of a store's items are sponsored, at what daily
 * budget, until when, and how they have done since.
 *
 * Set as boosting a post is on WhatsApp and Facebook: a daily budget from
 * $1 up, the more a day the more people see it, for a day, a week or a
 * month. A sponsored item takes a labelled slot about every sixth card in
 * the feed (see interleaveSponsored); a bigger budget shows it to more
 * people. It is paid through Paynow (see the Sponsor sheet). The listing's
 * `promotion` is read through here (`promotionOf`), so starting or stopping
 * one shows at once in the feed, on its card and in Stock. See
 * docs/business/monetization.md.
 *
 * Kept on the server: the signed in person's running boosts are loaded
 * (theirs and their stores'), and buying, stopping and taking back a stop
 * go through it (connectSponsorApi). Everyone else's come with the listing,
 * as its `promotion`.
 */

import { create } from 'zustand';
import type { Listing, PromotionSlot } from '../types/listing';

/** The daily budget: from $1, in whole dollars, up to this. */
export const SPONSOR_MIN_DAILY = 1;
export const SPONSOR_MAX_DAILY = 100;

/** How long, as the choices offer it. */
export const SPONSOR_DURATIONS = [
  { days: 1, label: '1 day' },
  { days: 7, label: '1 week' },
  { days: 30, label: '1 month' },
] as const;

export interface Sponsorship {
  listingId: string;
  /** The store it is posted as, when it is a store's. */
  storeId?: string;
  /** Dollars a day. */
  dailyBudget: number;
  /** Pre-formatted, as dates are across the mock. */
  startedLabel: string;
  endsLabel: string;
  daysLeft: number;
  /** Paid so far, in dollars. */
  spent: number;
  /** Reveals since it started, and how that compares with before. */
  revealsSince: number;
  /** "3.4x the week before", once there is enough to say. */
  lift?: string;
  /** Paynow's reference for the last payment. */
  paymentRef?: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function dayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** The day a run of `days` from today ends: "10 Nov". */
export function daysFromToday(days: number): string {
  const end = new Date();
  end.setDate(end.getDate() + days);
  return dayMonth(end);
}

/**
 * About how many people a day a budget reaches: a range, as Meta gives
 * one, since it depends on who is browsing. Roughly 120 to 200 a dollar.
 */
export function reachPerDay(dailyBudget: number): [number, number] {
  return [dailyBudget * 120, dailyBudget * 200];
}

/** "$35", "$1,200". */
export function dollars(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

/** The server's side of boosts, connected by the web app. */
export interface SponsorApi {
  /** Pays for a boost, or more days on a running one; resolves with it. */
  buy: (listingId: string, dailyBudget: number, days: number) => Promise<Sponsorship>;
  stop: (listingId: string) => Promise<void>;
  /** Takes back a stop; resolves with the boost running again. */
  restore: (listingId: string) => Promise<Sponsorship>;
}

let api: SponsorApi | null = null;

export function connectSponsorApi(connected: SponsorApi) {
  api = connected;
}

interface SponsorState {
  /** The signed in person's running boosts, and their stores'. */
  sponsorships: Sponsorship[];
  /** Listings whose boost was stopped here, so they leave the Sponsored
      slots at once, before the feed is read again. */
  stopped: string[];
  /** Listings whose "Sponsor this item" banner was closed with its X. */
  dismissed: string[];
  dismiss: (listingId: string) => void;
  /** Pays for a new boost, or more days at a budget that may change, and
      keeps it as the server has it. Rejects if refused. */
  buy: (listingId: string, dailyBudget: number, days: number) => Promise<Sponsorship>;
  /** Stops one at once; put back if the server refuses. */
  stop: (listingId: string) => Promise<void>;
  /** Puts back one just stopped, from the message's Undo. */
  restore: (sponsorship: Sponsorship) => Promise<void>;
}

function keep(sponsorships: Sponsorship[], sponsorship: Sponsorship): Sponsorship[] {
  return [...sponsorships.filter((s) => s.listingId !== sponsorship.listingId), sponsorship];
}

export const useSponsorStore = create<SponsorState>((set, get) => ({
  sponsorships: [],
  stopped: [],
  dismissed: [],
  dismiss: (listingId) =>
    set((state) =>
      state.dismissed.includes(listingId)
        ? state
        : { dismissed: [...state.dismissed, listingId] },
    ),
  buy: async (listingId, dailyBudget, days) => {
    if (!api) throw new Error('Boosts are not connected.');
    const sponsorship = await api.buy(listingId, dailyBudget, days);
    set((state) => ({
      sponsorships: keep(state.sponsorships, sponsorship),
      stopped: state.stopped.filter((id) => id !== listingId),
    }));
    return sponsorship;
  },
  stop: async (listingId) => {
    const was = get().sponsorships.find((s) => s.listingId === listingId);
    set((state) => ({
      sponsorships: state.sponsorships.filter((s) => s.listingId !== listingId),
      stopped: [...state.stopped.filter((id) => id !== listingId), listingId],
    }));
    try {
      await api?.stop(listingId);
    } catch (error) {
      set((state) => ({
        sponsorships: was ? keep(state.sponsorships, was) : state.sponsorships,
        stopped: state.stopped.filter((id) => id !== listingId),
      }));
      throw error;
    }
  },
  restore: async (sponsorship) => {
    set((state) => ({
      sponsorships: keep(state.sponsorships, sponsorship),
      stopped: state.stopped.filter((id) => id !== sponsorship.listingId),
    }));
    const back = await api?.restore(sponsorship.listingId);
    if (back) set((state) => ({ sponsorships: keep(state.sponsorships, back) }));
  },
}));

/** The sponsorships on one store's listings: what its console shows. */
export function useStoreSponsorships(storeId: string): Sponsorship[] {
  const sponsorships = useSponsorStore((state) => state.sponsorships);
  return sponsorships.filter((s) => s.storeId === storeId);
}

/** A listing's slot now: sponsored while a boost runs on it, as the server
    said, or as it has been bought or stopped here since. */
export function promotionOf(
  listing: Listing,
  sponsorships: Sponsorship[],
): PromotionSlot {
  if (sponsorships.some((s) => s.listingId === listing.id)) return 'sponsored';
  if (useSponsorStore.getState().stopped.includes(listing.id)) return 'organic';
  return listing.promotion;
}

/** The listing with its slot as it stands now. */
export function withPromotion<T extends Listing>(
  listing: T,
  sponsorships: Sponsorship[],
): T {
  const promotion = promotionOf(listing, sponsorships);
  return promotion === listing.promotion ? listing : { ...listing, promotion };
}
