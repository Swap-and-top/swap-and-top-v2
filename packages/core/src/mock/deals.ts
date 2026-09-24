/**
 * Mock deal confirmations and dealer promotion state.
 *
 * A confirmation is pending until both sides answer yes. A "no" is stored and
 * never shown to the other party.
 */

import type { DealConfirmation } from '../types/deal';

export const mockDealConfirmations: DealConfirmation[] = [
  {
    id: 'dc-1',
    revealId: 'rv-1',
    listingId: 'l-thinkpad-t480',
    buyerId: 'u-tarisai',
    sellerId: 'u-kopje',
    buyerAnswer: 'unanswered',
    sellerAnswer: 'yes',
    state: 'pending',
    promptedAt: '2026-09-24',
    lapsesAt: '2026-10-05',
  },
];

export function getDealConfirmation(id: string): DealConfirmation | undefined {
  return mockDealConfirmations.find((d) => d.id === id);
}

/** Confirmations awaiting the current user's answer. */
export const pendingConfirmationCount = mockDealConfirmations.filter(
  (d) => d.state === 'pending' && d.buyerAnswer === 'unanswered',
).length;

/* ------------------------------------------------------- promotion state - */

export interface PromotionProduct {
  id: 'lead-alerts' | 'sponsored-slot' | 'drop-slot';
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
    detail: 'Renews 12 Oct',
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
  {
    id: 'drop-slot',
    name: 'Friday Drop',
    description:
      'Ten checked deals published together at 7pm and pushed to the campus channel.',
    priceLabel: '$15 per slot',
    active: false,
    actionLabel: 'Apply for a slot',
    meta: 'Next drop Friday, 2 slots left',
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
