/**
 * Deal confirmation: mutual confirmation that a deal completed.
 *
 * Two things start one, both about one listing and two known people:
 *
 *  - **An accepted offer.** Both sides are known and agreed terms, so both
 *    are asked, three days after the offer was accepted.
 *  - **A number reveal by someone signed in.** Only the person who revealed
 *    is asked first. The listing's owner is asked only once they say yes, so
 *    an owner never hears about people who merely looked. Guest reveals ask
 *    nobody; they still count as reveals.
 *
 * One confirmation per person per listing, however many reveals or offers.
 * Two rules shape everything here:
 *  - a "no" is never shown to the other party and carries no consequence
 *  - it is not a complaint channel; complaints go through reporting
 */

export type DealAnswer = 'yes' | 'no' | 'not-yet' | 'unanswered';

export type DealConfirmationState = 'pending' | 'confirmed' | 'closed' | 'lapsed';

/** What started it: an accepted offer, or a number reveal. */
export type DealSource = 'offer' | 'reveal';

export interface DealConfirmation {
  id: string;
  source: DealSource;
  /** The accepted offer, when it came from one. */
  offerId?: string;
  /** The reveal, when it came from one. */
  revealId?: string;
  listingId: string;
  /** Who reached out: made the offer, or revealed the number. */
  askerId: string;
  /** Whose listing it is. */
  ownerId: string;
  askerAnswer: DealAnswer;
  /**
   * On a reveal the owner is asked only after the asker says yes; until
   * then this stays `unanswered` and the owner sees nothing.
   */
  ownerAnswer: DealAnswer;
  state: DealConfirmationState;
  promptedAt: string;
  /** Fourteen days after the reveal or acceptance. Lapses silently. */
  lapsesAt: string;
}

/** Counted only when both sides answer yes. */
export function isConfirmed(c: DealConfirmation): boolean {
  return c.askerAnswer === 'yes' && c.ownerAnswer === 'yes';
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
