/**
 * How an offer is put into words, in one place, so the form, the cards and
 * the lists all say it the same way.
 */

import type {
  Offer,
  OfferableListing,
  OfferCashFrom,
  OfferState,
} from '@snt/core';

/** A plain request, with nothing traded in: the offer's cash is a price. */
export function isPriceOffer(listing: OfferableListing): boolean {
  return listing.type === 'request';
}

/**
 * What the listing asks for, for the top of the offer form: the item wanted,
 * and the terms in a line under it — the budget, or what they have and who
 * adds cash.
 */
export function askParts(listing: OfferableListing): {
  item: string;
  terms: string;
} {
  // A sale that takes swaps: what is for sale, at its price.
  if (listing.type === 'sale') {
    return { item: listing.item.name, terms: `$${listing.price} · swaps accepted` };
  }
  if (listing.type === 'swap') {
    const upTo = listing.cashUpTo ? ' up to' : '';
    const cash = listing.cashAmount
      ? listing.cashDirection === 'i-add'
        ? `They add${upTo} $${listing.cashAmount}`
        : `You add $${listing.cashAmount}`
      : 'Straight swap';
    return { item: listing.wants.name, terms: `Has ${listing.has.name} · ${cash}` };
  }
  return {
    item: listing.wants.name,
    terms: `Budget up to $${listing.budget}`,
  };
}

/** The cash field on the form: its label, who the cash comes from, a start. */
export function cashSetup(listing: OfferableListing): {
  label: string;
  /** Shown after the label, as "(optional)" is everywhere on the form. */
  optional?: boolean;
  from: OfferCashFrom;
  amount: string;
} {
  // A trade-in towards something for sale: you add cash to your item, if
  // it is worth less. Nothing on top is fine too.
  if (listing.type === 'sale') {
    return { label: 'Cash you add', optional: true, from: 'offerer', amount: '' };
  }
  if (listing.type === 'request') {
    return { label: 'Your price', from: 'owner', amount: String(listing.budget) };
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
  listing: OfferableListing,
  readerIsOwner: boolean,
): {
  text: string;
  /** The words before the amount ("Their price", "You add"), and the
      amount itself, for a card that sets them on two lines. No label for a
      straight swap: the amount is then the words. */
  label?: string;
  amount: string;
  side: 'has' | 'wants' | null;
} {
  const amount = `$${offer.cashAmount}`;
  if (isPriceOffer(listing)) {
    const label = readerIsOwner ? 'Their price' : 'Your price';
    return { text: `${label} ${amount}`, label, amount, side: 'wants' };
  }
  if (offer.cashFrom === 'none' || offer.cashAmount === 0) {
    return { text: 'Straight swap', amount: 'Straight swap', side: null };
  }
  const ownerPays = offer.cashFrom === 'owner';
  const youPay = ownerPays === readerIsOwner;
  const label = youPay ? 'You add' : 'They add';
  return {
    text: `${label} ${amount}`,
    label,
    amount,
    side: ownerPays ? 'has' : 'wants',
  };
}

export const OFFER_STATE_LABELS: Record<OfferState, string> = {
  pending: 'Waiting for a reply',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};
