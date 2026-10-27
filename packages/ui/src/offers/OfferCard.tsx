'use client';

/**
 * OfferCard — one offer, as a card.
 *
 * The same card on both sides. To the listing's owner it shows who is
 * offering and lets them accept or decline. To the person who made it, it
 * shows which listing it was for and lets them withdraw it. Once accepted,
 * either way, it turns into the introduction: the ways the other person can
 * be reached, shown at once, with a first WhatsApp message ready. That is
 * where an offer is meant to end — it opens the conversation, it does not
 * replace it.
 */

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CONDITION_LABELS,
  contactWaysFor,
  getListing,
  getStore,
  getUser,
  setOfferStateOptimistically,
  type OfferableListing,
  type Offer,
  type OfferState,
} from '@snt/core';
import { SellerIcon } from '../cards/SellerIcon';
import { ContactWayList, waysOffered } from '../contact/ContactWays';
import { Button } from '../primitives/Button';
import { Bone } from '../primitives/Skeleton';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { cashLine, OFFER_STATE_LABELS } from './offerWords';
import styles from './Offers.module.css';

/** How long a message with Undo stays up: two seconds past the usual 2.5. */
const UNDO_TOAST_MS = 4500;

const DONE: Record<Exclude<OfferState, 'pending'>, string> = {
  accepted: 'Offer accepted',
  declined: 'Offer declined',
  withdrawn: 'Offer withdrawn',
};

export function OfferCard({
  offer,
  view,
  underListing = false,
}: {
  offer: Offer;
  /** `received`: the reader owns the listing. `made`: the reader sent it. */
  view: 'received' | 'made';
  /** Shown where the listing is already in view (under it on Offers, or in
      the sheet opened from it): a made offer then says only who it went to,
      not which listing. */
  underListing?: boolean;
}) {
  /** Which answer is on its way, so its button shows the spinner. */
  const [working, setWorking] = useState<OfferState | null>(null);
  const listing = getListing(offer.listingId);
  if (!listing || listing.type === 'auction') {
    return null;
  }
  // A swap or a request, or a sale an offer was made on.
  const target: OfferableListing = listing;
  const readerIsOwner = view === 'received';

  // The other person: the offerer to the owner, the owner to the offerer.
  const otherId = readerIsOwner ? offer.fromUserId : listing.ownerId;
  const other = getUser(otherId);
  const otherStore = getStore(other?.storeId);
  const otherName = otherStore?.name ?? other?.displayName ?? 'Someone';

  const cash = cashLine(offer, target, readerIsOwner);
  const wanted =
    target.type === 'sale' ? target.item.name : target.wants.name;

  async function change(next: Exclude<OfferState, 'pending'>) {
    setWorking(next);
    try {
      await setOfferStateOptimistically(offer.id, next);
      // A decline or an accept can be undone at once, from the message.
      // A decline can also be undone later, from the card. An accept only
      // here: in the real system the other person is told, and sees your
      // details, once this moment has passed, so until then nothing has
      // been shared and the undo is real. After it, it cannot be taken back.
      if (next === 'declined' || next === 'accepted') {
        toast.success(DONE[next], {
          action: { label: 'Undo', onClick: () => void undo(next) },
          duration: UNDO_TOAST_MS,
        });
      } else {
        toast.success(DONE[next]);
      }
    } catch {
      toast.error('That did not go through. Try again.');
    } finally {
      setWorking(null);
    }
  }

  /** An accepted or declined offer back to waiting, to decide again. */
  async function undo(was: 'accepted' | 'declined') {
    try {
      await setOfferStateOptimistically(offer.id, 'pending');
      toast.success(
        was === 'declined'
          ? 'Decline undone. You can accept it now.'
          : 'Accept undone. Nothing was shared.',
      );
    } catch {
      toast.error('That did not go through. Try again.');
    }
  }

  // The other person's ways: the owner's, as on the listing; the offerer's,
  // as they chose for this offer from the ways on their account.
  const otherWays = contactWaysFor(otherId);
  const given = waysOffered(otherWays);
  const reachable = readerIsOwner && offer.reachOn
    ? given.filter((way) => offer.reachOn!.includes(way))
    : given;
  // What was offered, in words: the item, or the price of a cash offer.
  const offered = offer.item
    ? `the ${offer.item.name}`
    : `$${offer.cashAmount} for the ${wanted}`;
  const opener = readerIsOwner
    ? `Hi, I accepted your offer of ${offered} on Swap & Top.`
    : `Hi, you accepted my offer of ${offered} on Swap & Top.`;

  return (
    <div className={styles.offer}>
      <div className={styles.offerHead}>
        {readerIsOwner ? (
          <span className={styles.who}>
            <SellerIcon kind={otherStore ? 'store' : 'person'} />
            {otherName}
            {other ? <ConfirmedDealsBadge count={other.confirmedDeals} /> : null}
          </span>
        ) : underListing ? (
          // The listing is just above: say only who it went to.
          <span className={styles.who}>
            <SellerIcon kind={otherStore ? 'store' : 'person'} />
            Sent to {otherName}
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
          {/* The condition beside the name while there is room, under it
              when there is not. */}
          <span className={styles.itemLine}>
            {/* A cash offer has no item: it says so. */}
            <span className={styles.itemName}>
              {offer.item ? offer.item.name : 'Cash, no swap'}
            </span>
            {offer.item?.condition ? (
              <span className={styles.itemNote}>
                {CONDITION_LABELS[offer.item.condition]}
              </span>
            ) : null}
          </span>
        </div>
        {/* The cash: its label small and grey over it, as "They offer"
            is over the item; the amount under it. */}
        <span className={styles.cashBlock}>
          {cash.label ? (
            <span className={styles.itemLabel}>{cash.label}</span>
          ) : null}
          <span
            className={[
              styles.cash,
              cash.side === 'has' ? styles.cashHas : '',
              cash.side === 'wants' ? styles.cashWants : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {cash.amount}
          </span>
        </span>
      </div>

      {offer.message ? <p className={styles.message}>“{offer.message}”</p> : null}

      {offer.state === 'pending' ? (
        <div className={styles.actions}>
          {readerIsOwner ? (
            <>
              <Button
                size="sm"
                loading={working === 'accepted'}
                disabled={working !== null}
                onClick={() => change('accepted')}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={working === 'declined'}
                disabled={working !== null}
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
                loading={working === 'withdrawn'}
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
        <>
          {/* Its state in a pill, as a listing's Live or Paused is. */}
          <span className={[styles.statePill, styles.pillAccepted].join(' ')}>
            {OFFER_STATE_LABELS.accepted}
          </span>
          {/* The introduction: their ways, shown at once, as small tiles
              side by side, WhatsApp with a first message ready. */}
          <div className={styles.introduction}>
            <span className={styles.contactLabel}>Contact {otherName}</span>
            <ContactWayList
              ways={otherWays}
              only={reachable}
              revealed
              message={opener}
              compact
            />
          </div>
        </>
      ) : null}

      {/* Declined in a red pill; withdrawn in a plain grey one. The owner
          can undo a decline, if they change their mind. */}
      {offer.state === 'declined' || offer.state === 'withdrawn' ? (
        <div className={styles.closedRow}>
          <span
            className={[
              styles.statePill,
              offer.state === 'declined' ? styles.pillDeclined : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {OFFER_STATE_LABELS[offer.state]}
          </span>
          {offer.state === 'declined' && readerIsOwner ? (
            <Button size="sm" variant="secondary" onClick={() => void undo('declined')}>
              Undo decline
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** An offer while it loads: the same card, its lines in bones. */
export function OfferCardSkeleton({
  messageLines = 1,
}: {
  /** How long its message usually runs. */
  messageLines?: number;
}) {
  return (
    <div className={styles.offer} aria-hidden>
      <div className={styles.offerHead}>
        <Bone width={130} height={18} />
        <Bone width={40} height={10} />
      </div>
      <div className={styles.terms}>
        <div className={styles.item}>
          <Bone width={60} height={10} />
          <Bone width={180} height={16} style={{ marginTop: 6 }} />
        </div>
        <Bone width={90} height={16} />
      </div>
      <div style={{ margin: '4px 0' }}>
        {Array.from({ length: messageLines }).map((_, i) => (
          <Bone
            key={i}
            width={i === messageLines - 1 ? '60%' : '90%'}
            height={12}
            style={{ marginTop: i ? 7 : 0 }}
          />
        ))}
      </div>
      <div className={styles.actions}>
        <Bone shape="pill" width={84} height={36} />
        <Bone shape="pill" width={90} height={36} />
      </div>
    </div>
  );
}
