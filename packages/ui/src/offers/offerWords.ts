/**
 * How an offer is put into words, in one place, so the form, the cards and
 * the lists all say it the same way.
 */

import type {
  DemandListing,
  Offer,
  OfferCashFrom,
  OfferState,
} from '@snt/core';

/** A plain request, with nothing traded in: the offer's cash is a price. */
export function isPriceOffer(listing: DemandListing): boolean {
  return listing.type === 'request' && !listing.tradeIn;
}

/**
 * What the listing asks for, for the top of the offer form: the item wanted,
 * and the terms in a line under it — the budget, or what they have and who
 * adds cash.
 */
export function askParts(listing: DemandListing): {
  item: string;
  terms: string;
} {
  if (listing.type === 'swap') {
    const cash = listing.cashAmount
      ? listing.cashDirection === 'i-add'
        ? `They add $${listing.cashAmount}`
        : `You add $${listing.cashAmount}`
      : 'Straight swap';
    return { item: listing.wants.name, terms: `Has ${listing.has.name} · ${cash}` };
  }
  return {
    item: listing.wants.name,
    terms: listing.tradeIn
      ? `Has ${listing.tradeIn.name} · adds up to $${listing.budget}`
      : `Budget up to $${listing.budget}`,
  };
}

/** The cash field on the form: its label, who the cash comes from, a start. */
export function cashSetup(listing: DemandListing): {
  label: string;
  /** Shown after the label, as "(optional)" is everywhere on the form. */
  optional?: boolean;
  from: OfferCashFrom;
  amount: string;
} {
  if (listing.type === 'request') {
    return listing.tradeIn
      ? { label: 'Cash they add', from: 'owner', amount: String(listing.budget) }
      : { label: 'Your price', from: 'owner', amount: String(listing.budget) };
  }
  if (listing.cashDirection === 'i-add') {
    return {
      label: 'Cash they add',
      from: 'owner',
      amount: String(listing.cashAmount ?? ''),
    };
  }
  return {
    label: 'Cash you add',
    optional: listing.cashDirection === 'straight',
    from: 'offerer',
    amount: listing.cashAmount ? String(listing.cashAmount) : '',
  };
}

/**
 * An offer's cash, worded for whoever is reading it: "you" is the reader.
 * `side` says which side's colour it takes — blue when the cash comes with
 * what the owner has, green when it comes with what they are looking for.
 */
export function cashLine(
  offer: Offer,
  listing: DemandListing,
  readerIsOwner: boolean,
): { text: string; side: 'has' | 'wants' | null } {
  if (isPriceOffer(listing)) {
    return {
      text: `${readerIsOwner ? 'Their price' : 'Your price'} $${offer.cashAmount}`,
      side: 'wants',
    };
  }
  if (offer.cashFrom === 'none' || offer.cashAmount === 0) {
    return { text: 'Straight swap', side: null };
  }
  const ownerPays = offer.cashFrom === 'owner';
  const youPay = ownerPays === readerIsOwner;
  return {
    text: `${youPay ? 'You add' : 'They add'} $${offer.cashAmount}`,
    side: ownerPays ? 'has' : 'wants',
  };
}

export const OFFER_STATE_LABELS: Record<OfferState, string> = {
  pending: 'Waiting for a reply',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};
