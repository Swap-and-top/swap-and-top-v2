/**
 * Sponsored slots: which of a shop's items are sponsored, at what daily
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
 */

import { create } from 'zustand';
import { mockListings } from '../mock/listings';
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

/** "Today" in the mock, for the dates a sponsorship runs to. */
const TODAY = new Date(2026, 9, 27);
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function dayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** The day a run of `days` from today ends: "10 Nov". */
export function daysFromToday(days: number): string {
  const end = new Date(TODAY);
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

interface SponsorState {
  sponsorships: Sponsorship[];
  /** Listings whose "Sponsor this item" banner was closed with its X. */
  dismissed: string[];
  dismiss: (listingId: string) => void;
  /** A new sponsorship, once Paynow confirms the payment. */
  start: (
    listingId: string,
    dailyBudget: number,
    days: number,
    paymentRef: string,
  ) => void;
  /** More days, at a budget that may change, once paid. */
  extend: (
    listingId: string,
    dailyBudget: number,
    days: number,
    paymentRef: string,
  ) => void;
  stop: (listingId: string) => void;
  /** Puts back one just stopped, from the message's Undo. */
  restore: (sponsorship: Sponsorship) => void;
}

export const useSponsorStore = create<SponsorState>((set) => ({
  // The Dell Latitude 7490, sponsored a week ago at $3 a day for two weeks.
  sponsorships: [
    {
      listingId: 'l-dell-latitude-7490',
      dailyBudget: 3,
      startedLabel: '20 Oct',
      endsLabel: '3 Nov',
      daysLeft: 7,
      spent: 42,
      revealsSince: 31,
      lift: '3.4x the week before',
      paymentRef: 'PN 4819 2207',
    },
    // Other people's, one of each kind, so the Sponsored label shows on
    // every card in the feed: a sale, two swaps, two Wanted listings.
    {
      listingId: 'l-iphone-11-128',
      dailyBudget: 2,
      startedLabel: '25 Oct',
      endsLabel: '1 Nov',
      daysLeft: 5,
      spent: 14,
      revealsSince: 3,
    },
    {
      listingId: 'l-ps4-for-xbox',
      dailyBudget: 1,
      startedLabel: '25 Oct',
      endsLabel: '1 Nov',
      daysLeft: 5,
      spent: 7,
      revealsSince: 2,
    },
    {
      listingId: 'l-galaxy-swap',
      dailyBudget: 3,
      startedLabel: '23 Oct',
      endsLabel: '30 Oct',
      daysLeft: 3,
      spent: 21,
      revealsSince: 3,
    },
    {
      listingId: 'l-rtx-wanted',
      dailyBudget: 2,
      startedLabel: '26 Oct',
      endsLabel: '2 Nov',
      daysLeft: 6,
      spent: 14,
      revealsSince: 0,
    },
    {
      listingId: 'l-galaxy-s21-wanted',
      dailyBudget: 1,
      startedLabel: '25 Oct',
      endsLabel: '26 Nov',
      daysLeft: 30,
      spent: 30,
      revealsSince: 1,
    },
  ],
  dismissed: [],
  dismiss: (listingId) =>
    set((state) =>
      state.dismissed.includes(listingId)
        ? state
        : { dismissed: [...state.dismissed, listingId] },
    ),
  start: (listingId, dailyBudget, days, paymentRef) =>
    set((state) => ({
      sponsorships: [
        ...state.sponsorships.filter((s) => s.listingId !== listingId),
        {
          listingId,
          dailyBudget,
          startedLabel: dayMonth(TODAY),
          endsLabel: daysFromToday(days),
          daysLeft: days,
          spent: dailyBudget * days,
          revealsSince: 0,
          paymentRef,
        },
      ],
    })),
  extend: (listingId, dailyBudget, days, paymentRef) =>
    set((state) => ({
      sponsorships: state.sponsorships.map((s) =>
        s.listingId === listingId
          ? {
              ...s,
              dailyBudget,
              daysLeft: s.daysLeft + days,
              endsLabel: daysFromToday(s.daysLeft + days),
              spent: s.spent + dailyBudget * days,
              paymentRef,
            }
          : s,
      ),
    })),
  stop: (listingId) =>
    set((state) => ({
      sponsorships: state.sponsorships.filter((s) => s.listingId !== listingId),
    })),
  restore: (sponsorship) =>
    set((state) => ({
      sponsorships: [
        ...state.sponsorships.filter(
          (s) => s.listingId !== sponsorship.listingId,
        ),
        sponsorship,
      ],
    })),
}));

/** The sponsorships on one shop's listings: what its console shows. */
export function useShopSponsorships(shopId: string): Sponsorship[] {
  const sponsorships = useSponsorStore((state) => state.sponsorships);
  return sponsorships.filter(
    (s) => mockListings.find((l) => l.id === s.listingId)?.shopId === shopId,
  );
}

/** A listing's slot now: sponsored while it has a sponsorship running. */
export function promotionOf(
  listing: Listing,
  sponsorships: Sponsorship[],
): PromotionSlot {
  return sponsorships.some((s) => s.listingId === listing.id)
    ? 'sponsored'
    : 'organic';
}

/** The listing with its slot as it stands now. */
export function withPromotion<T extends Listing>(
  listing: T,
  sponsorships: Sponsorship[],
): T {
  const promotion = promotionOf(listing, sponsorships);
  return promotion === listing.promotion ? listing : { ...listing, promotion };
}
