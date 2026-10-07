'use client';

/**
 * OfferCard — one offer, as a card.
 *
 * The same card on both sides. To the listing's owner it shows who is
 * offering and lets them accept or decline. To the person who made it, it
 * shows which listing it was for and lets them withdraw it. Once accepted,
 * either way, it turns into the introduction: the other person's number and
 * a way straight into WhatsApp. That is where an offer is meant to end — it
 * opens the conversation, it does not replace it.
 */

import Link from 'next/link';
import { toast } from 'sonner';
import {
  CONDITION_LABELS,
  contactNumberFor,
  getListing,
  getShop,
  getUser,
  setOfferStateOptimistically,
  type DemandListing,
  type Offer,
  type OfferState,
} from '@snt/core';
import { SellerIcon } from '../cards/SellerIcon';
import { MessageIcon } from '../icons';
import { Button, ButtonLink } from '../primitives/Button';
import { Panel } from '../primitives/Surface';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { cashLine, OFFER_STATE_LABELS, whatsappHref } from './offerWords';
import styles from './Offers.module.css';

const DONE: Record<Exclude<OfferState, 'pending'>, string> = {
  accepted: 'Offer accepted',
  declined: 'Offer declined',
  withdrawn: 'Offer withdrawn',
};

export function OfferCard({
  offer,
  view,
}: {
  offer: Offer;
  /** `received`: the reader owns the listing. `made`: the reader sent it. */
  view: 'received' | 'made';
}) {
  const listing = getListing(offer.listingId);
  if (!listing || (listing.type !== 'swap' && listing.type !== 'request')) {
    return null;
  }
  const demand: DemandListing = listing;
  const readerIsOwner = view === 'received';

  // The other person: the offerer to the owner, the owner to the offerer.
  const otherId = readerIsOwner ? offer.fromUserId : listing.ownerId;
  const other = getUser(otherId);
  const otherShop = getShop(other?.shopId);
  const otherName = otherShop?.name ?? other?.displayName ?? 'Someone';

  const cash = cashLine(offer, demand, readerIsOwner);
  const wanted =
    demand.type === 'swap' ? demand.wants.name : demand.wants.name;

  async function change(next: Exclude<OfferState, 'pending'>) {
    try {
      await setOfferStateOptimistically(offer.id, next);
      toast.success(DONE[next]);
    } catch {
      toast.error('That did not go through. Try again.');
    }
  }

  const number = contactNumberFor(otherId);
  const opener = readerIsOwner
    ? `Hi, I accepted your offer of the ${offer.item.name} on Swap & Top.`
    : `Hi, you accepted my offer of the ${offer.item.name} on Swap & Top.`;

  return (
    <Panel className={styles.offer}>
      <div className={styles.offerHead}>
        {readerIsOwner ? (
          <span className={styles.who}>
            <SellerIcon kind={otherShop ? 'shop' : 'person'} />
            {otherName}
            {other ? <ConfirmedDealsBadge count={other.confirmedDeals} /> : null}
          </span>
        ) : (
          // Their own offer: say which listing it was for, and link to it.
          <Link href={`/listing/${listing.slug}`} className={styles.forListing}>
            For {otherName}’s “{wanted}”
          </Link>
        )}
        <span className={styles.sent}>{offer.sentLabel}</span>
      </div>

      {/* The offer itself: the item put forward, and the cash. */}
      <div className={styles.terms}>
        <div className={styles.item}>
          <span className={styles.itemLabel}>
            {readerIsOwner ? 'They offer' : 'You offered'}
          </span>
          <span className={styles.itemName}>{offer.item.name}</span>
          {offer.item.condition ? (
            <span className={styles.itemNote}>
              {CONDITION_LABELS[offer.item.condition]}
            </span>
          ) : null}
        </div>
        <span
          className={[
            styles.cash,
            cash.side === 'has' ? styles.cashHas : '',
            cash.side === 'wants' ? styles.cashWants : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {cash.text}
        </span>
      </div>

      {offer.message ? <p className={styles.message}>“{offer.message}”</p> : null}

      {offer.state === 'pending' ? (
        <div className={styles.actions}>
          {readerIsOwner ? (
            <>
              <Button size="sm" onClick={() => change('accepted')}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => change('declined')}
              >
                Decline
              </Button>
            </>
          ) : (
            <>
              <span className={styles.state}>{OFFER_STATE_LABELS.pending}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => change('withdrawn')}
              >
                Withdraw
              </Button>
            </>
          )}
        </div>
      ) : null}

      {/* Accepted: the introduction. Each sees the other's number, and a
          first WhatsApp message is ready to send. */}
      {offer.state === 'accepted' ? (
        <div className={styles.accepted}>
          <div className={styles.contact}>
            <span className={styles.contactLabel}>
              Accepted · contact {otherName}
            </span>
            <span className={styles.number}>{number}</span>
          </div>
          <ButtonLink
            href={whatsappHref(number, opener)}
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageIcon size={16} />
            WhatsApp
          </ButtonLink>
        </div>
      ) : null}

      {offer.state === 'declined' || offer.state === 'withdrawn' ? (
        <div className={styles.closed}>{OFFER_STATE_LABELS[offer.state]}</div>
      ) : null}
    </Panel>
  );
}
