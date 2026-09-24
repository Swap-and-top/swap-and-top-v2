/**
 * Deal confirmation — mutual confirmation that a deal completed.
 *
 * Three days after a reveal both parties are asked one question. When both say
 * yes it counts. This is the platform's only window into settlement, and the
 * trust signal that replaced status badges.
 *
 * Two rules that shape everything here:
 *  - a "no" is never shown to the other party and carries no consequence
 *  - it is not a complaint channel; complaints go through reporting
 */

export type DealAnswer = 'yes' | 'no' | 'not-yet' | 'unanswered';

export type DealConfirmationState = 'pending' | 'confirmed' | 'closed' | 'lapsed';

export interface DealConfirmation {
  id: string;
  /** The reveal that started the clock. */
  revealId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  buyerAnswer: DealAnswer;
  sellerAnswer: DealAnswer;
  state: DealConfirmationState;
  promptedAt: string;
  /** Fourteen days after the reveal. Lapses silently, never chased. */
  lapsesAt: string;
}

/** Counted only when both sides answer yes. */
export function isConfirmed(c: DealConfirmation): boolean {
  return c.buyerAnswer === 'yes' && c.sellerAnswer === 'yes';
}

/**
 * A reveal event. Recorded rather than counted, because the slot type at the
 * moment of reveal is what lets promotion be sold on evidence.
 */
export interface RevealEvent {
  id: string;
  listingId: string;
  /** A hash used for rate limiting. Not an identity. */
  deviceHash: string;
  viewerId?: string;
  slotAtReveal: 'organic' | 'sponsored' | 'drop';
  at: string;
}
