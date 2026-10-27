/**
 * Mock deal confirmations and dealer promotion state.
 *
 * One of each case the current user (Tarisai) can meet: numbers she revealed
 * and has not answered, a buyer's yes on her own listing waiting for her,
 * an accepted offer of hers, one already confirmed, and two she must not
 * see (a reveal on her listing the buyer has not answered, so she is not
 * asked yet). A "no" is stored and never shown to the other party.
 */

import type { DealAnswer, DealConfirmation } from '../types/deal';
import { CURRENT_USER_ID } from './users';

export const mockDealConfirmations: DealConfirmation[] = [
  {
    // She revealed Kopje's number on the ThinkPad.
    id: 'dc-1',
    source: 'reveal',
    revealId: 'rv-1',
    listingId: 'l-thinkpad-t480',
    askerId: 'u-tarisai',
    ownerId: 'u-kopje',
    askerAnswer: 'unanswered',
    ownerAnswer: 'unanswered',
    state: 'pending',
    promptedAt: '2026-10-18',
    lapsesAt: '2026-10-29',
  },
  {
    // She revealed Chipo's number on the AirPods.
    id: 'dc-2',
    source: 'reveal',
    revealId: 'rv-2',
    listingId: 'l-airpods-pro',
    askerId: 'u-tarisai',
    ownerId: 'u-chipo',
    askerAnswer: 'unanswered',
    ownerAnswer: 'unanswered',
    state: 'pending',
    promptedAt: '2026-10-19',
    lapsesAt: '2026-10-30',
  },
  {
    // Her offer of the RX 580 for Blessing's GTX 1650 was accepted, so both
    // are asked. Blessing has said yes.
    id: 'dc-3',
    source: 'offer',
    offerId: 'o-tarisai-rx580',
    listingId: 'l-gtx-1650-swap',
    askerId: 'u-tarisai',
    ownerId: 'u-blessing',
    askerAnswer: 'unanswered',
    ownerAnswer: 'yes',
    state: 'pending',
    promptedAt: '2026-10-17',
    lapsesAt: '2026-10-28',
  },
  {
    // Rudo revealed her number on the MacBook and says the deal went
    // through, so now she is asked to confirm.
    id: 'dc-4',
    source: 'reveal',
    revealId: 'rv-4',
    listingId: 'l-macbook-swap',
    askerId: 'u-rudo',
    ownerId: 'u-tarisai',
    askerAnswer: 'yes',
    ownerAnswer: 'unanswered',
    state: 'pending',
    promptedAt: '2026-10-20',
    lapsesAt: '2026-10-31',
  },
  {
    // Already confirmed by both: the DualSense from Avondale Games.
    id: 'dc-5',
    source: 'reveal',
    revealId: 'rv-5',
    listingId: 'l-dualsense',
    askerId: 'u-tarisai',
    ownerId: 'u-avgames',
    askerAnswer: 'yes',
    ownerAnswer: 'yes',
    state: 'confirmed',
    promptedAt: '2026-09-12',
    lapsesAt: '2026-09-23',
  },
  {
    // Chipo revealed her number on the PS5 controller Wanted listing and
    // has not answered: Tarisai is not asked, and never sees this.
    id: 'dc-6',
    source: 'reveal',
    revealId: 'rv-6',
    listingId: 'l-ps5-controller-wanted',
    askerId: 'u-chipo',
    ownerId: 'u-tarisai',
    askerAnswer: 'unanswered',
    ownerAnswer: 'unanswered',
    state: 'pending',
    promptedAt: '2026-10-19',
    lapsesAt: '2026-10-30',
  },
  {
    // Farai revealed Kopje's number on the EliteBook and says the deal went
    // through: the shop is asked to confirm, from Leads (Number reveals).
    id: 'dc-8',
    source: 'reveal',
    revealId: 'rv-4',
    listingId: 'l-hp-elitebook-840',
    askerId: 'u-farai',
    ownerId: 'u-kopje',
    askerAnswer: 'yes',
    ownerAnswer: 'unanswered',
    state: 'pending',
    promptedAt: '2026-10-23',
    lapsesAt: '2026-11-03',
  },
  {
    // Kopje's own deal check with someone else: not hers at all.
    id: 'dc-7',
    source: 'offer',
    offerId: 'o-kopje-redmi',
    listingId: 'l-redmi-wanted',
    askerId: 'u-kopje',
    ownerId: 'u-rudo',
    askerAnswer: 'unanswered',
    ownerAnswer: 'unanswered',
    state: 'pending',
    promptedAt: '2026-10-18',
    lapsesAt: '2026-10-29',
  },
];

export function getDealConfirmation(id: string): DealConfirmation | undefined {
  return mockDealConfirmations.find((d) => d.id === id);
}

/**
 * Whose side the deal check is shown from: the signed in user's where they
 * are on it; otherwise the listing's owner, which in this mock is the shop
 * answering from its console.
 */
export function viewerOn(d: DealConfirmation): string {
  return d.askerId === CURRENT_USER_ID || d.ownerId === CURRENT_USER_ID
    ? CURRENT_USER_ID
    : d.ownerId;
}

/** Whether the one answering owns the listing the deal is about. */
export function isOwnerOn(d: DealConfirmation): boolean {
  return d.ownerId === viewerOn(d);
}

/** The other person on the deal. */
export function otherPartyOn(d: DealConfirmation): string {
  return isOwnerOn(d) ? d.askerId : d.ownerId;
}

/**
 * Whether the current user has been asked at all. Always on an offer; on a
 * reveal the asker is asked, and the owner only once the asker says yes.
 */
export function isAskedOn(d: DealConfirmation): boolean {
  if (d.askerId === CURRENT_USER_ID) return true;
  if (d.ownerId !== CURRENT_USER_ID) return false;
  return d.source === 'offer' || d.askerAnswer === 'yes';
}

/** The deals the current user has been asked about, newest first. */
export const myDealConfirmations = mockDealConfirmations
  .filter(isAskedOn)
  .sort((a, b) => b.promptedAt.localeCompare(a.promptedAt));

/**
 * The current user's answer: what they gave on this visit, else what the
 * mock already holds for their side.
 */
export function myAnswerOn(
  d: DealConfirmation,
  answers: Record<string, DealAnswer>,
): DealAnswer {
  return answers[d.id] ?? (isOwnerOn(d) ? d.ownerAnswer : d.askerAnswer);
}

/** The other side's answer. Used only to tell whether a yes counts; never
    shown, since a "no" is never shown to the other party. */
export function theirAnswerOn(d: DealConfirmation): DealAnswer {
  return isOwnerOn(d) ? d.askerAnswer : d.ownerAnswer;
}

/** Still waiting on the current user: not answered, or "not yet". */
export function awaitsMyAnswer(
  d: DealConfirmation,
  answers: Record<string, DealAnswer>,
): boolean {
  const given = myAnswerOn(d, answers);
  return given === 'unanswered' || given === 'not-yet';
}

/** How many deals wait on the current user's answer. */
export function confirmationsAwaiting(
  answers: Record<string, DealAnswer>,
): number {
  return myDealConfirmations.filter((d) => awaitsMyAnswer(d, answers)).length;
}

/* ------------------------------------------------------- promotion state - */

/**
 * What a dealer can pay for to grow their numbers. The Friday Drop is paused
 * for now and left out (see docs/business/monetization.md); it may return.
 */
export interface PromotionProduct {
  id: 'lead-alerts' | 'sponsored-slot';
  name: string;
  description: string;
  /** Display string, because prices are hypotheses rather than settled. */
  priceLabel: string;
  active: boolean;
  /** Shown when active. */
  detail?: string;
  actionLabel?: string;
  meta?: string;
}

export const mockPromotionProducts: PromotionProduct[] = [
  {
    id: 'lead-alerts',
    name: 'Lead alerts',
    description:
      'Alerted the moment someone posts a request matching your stock.',
    priceLabel: '$10 a month',
    active: true,
    detail: 'Renews 30 Oct',
  },
  {
    id: 'sponsored-slot',
    name: 'Sponsored slots',
    description:
      'Your item appears in a labelled slot roughly every sixth card in the feed.',
    priceLabel: '$12 a week per item',
    active: false,
    actionLabel: 'Sponsor an item',
    meta: '1 running',
  },
];

export const mockConsoleStats = {
  revealsSevenDays: 40,
  confirmedDealsThirtyDays: 12,
  /** Reveals on sponsored listings against everything else. Sells promotion. */
  sponsoredLift: '3.4x',
  bestPerformer: {
    listingId: 'l-dell-latitude-7490',
    label: 'Dell Latitude 7490 i7',
    reveals: 31,
    sponsored: true,
  },
} as const;
