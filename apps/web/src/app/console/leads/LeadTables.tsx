'use client';

/**
 * The Number reveals and Offers sent tabs of Leads, as tables set exactly as
 * Stock's is: from a wide screen, one white card with a dark blue band of
 * column headings and rows parted by thin lines; between a tablet and a wide
 * screen, cards two to a row; on a phone, a card per row with the key facts.
 * A long list stays easy to scan.
 */

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  getListing,
  getUser,
  setOfferStateOptimistically,
  type NumberReveal,
  type Offer,
  type OfferState,
} from '@snt/core';
import {
  ActionMenu,
  Badge,
  cashLine,
  OfferCard,
  Sheet,
  type BadgeTone,
  type MenuAction,
} from '@snt/ui';
import {
  EyeIcon,
  PhoneIcon,
  TrashIcon,
  WhatsAppIcon,
} from '@snt/ui/icons';
import styles from './LeadTables.module.css';

/* ------------------------------------------------------ number reveals --- */

const DEAL_BADGE: Record<NumberReveal['deal'], { tone: BadgeTone; label: string }> = {
  waiting: { tone: 'neutral', label: '' },
  asked: { tone: 'accent', label: 'Answer needed' },
  confirmed: { tone: 'success', label: 'Deal confirmed' },
};

export function RevealsTable({ reveals }: { reveals: NumberReveal[] }) {
  return (
    <div className={[styles.list, styles.reveals].join(' ')}>
      {/* Wide screens only: the column headings. */}
      <div className={styles.headerRow} aria-hidden>
        <span />
        <span>Who</span>
        <span>Contact</span>
        <span>Listing</span>
        <span className={styles.alignRight}>Price</span>
        <span>When</span>
        <span className={styles.alignRight}>Their deals</span>
        <span>Deal check</span>
      </div>

      {reveals.map((reveal) => {
        const user = getUser(reveal.userId);
        const listing = getListing(reveal.listingId);
        const name = user?.displayName ?? 'Someone';
        const item =
          listing && listing.type === 'sale' ? listing.item.name : listing?.title;
        const price =
          listing && listing.type === 'sale' && listing.price > 0
            ? listing.price
            : undefined;
        const way = reveal.way === 'whatsapp' ? 'WhatsApp' : 'Call';
        const deal = DEAL_BADGE[reveal.deal];
        const dealLabel =
          reveal.deal === 'waiting'
            ? `Asking in ${reveal.daysToAsk ?? 3} days`
            : deal.label;

        return (
          <div key={reveal.id} className={styles.row}>
            {/* The whole row opens the listing they came from. */}
            {listing ? (
              <Link
                href={`/listing/${listing.slug}`}
                className={styles.rowLink}
                aria-label={`${name}, on your ${item}`}
              />
            ) : null}
            <span className={styles.tile} aria-hidden>
              {reveal.way === 'whatsapp' ? (
                <WhatsAppIcon size={17} />
              ) : (
                <PhoneIcon size={17} />
              )}
            </span>
            <span className={styles.who}>{name}</span>
            <span className={styles.way}>{way}</span>
            <span className={styles.listing}>{item}</span>
            <span className={styles.price}>
              {price !== undefined ? `$${price}` : null}
            </span>
            <span className={styles.when}>{reveal.atLabel}</span>
            <span className={styles.deals}>{user?.confirmedDeals ?? 0}</span>
            <span className={styles.badge}>
              <Badge tone={deal.tone}>{dealLabel}</Badge>
            </span>
            {/* A phone's card: how and when, in one quiet line. */}
            <span className={styles.phoneMeta}>
              {way} · {reveal.atLabel} · {reveal.area}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------- offers sent --- */

const OFFER_BADGE: Record<OfferState, { tone: BadgeTone; label: string }> = {
  pending: { tone: 'accent', label: 'Waiting' },
  accepted: { tone: 'success', label: 'Accepted' },
  declined: { tone: 'danger', label: 'Declined' },
  withdrawn: { tone: 'neutral', label: 'Withdrawn' },
};

export function SentOffersTable({ offers }: { offers: Offer[] }) {
  /** The offer open in full: its message, and contact ways once accepted.
      Looked up afresh, so a withdrawal made in it shows at once. */
  const [openId, setOpenId] = useState<string | null>(null);
  const open = offers.find((offer) => offer.id === openId) ?? null;

  return (
    <>
      <div className={[styles.list, styles.offers].join(' ')}>
        <div className={styles.headerRow} aria-hidden>
          <span>Request</span>
          <span>You offered</span>
          <span>Cash</span>
          <span>Sent</span>
          <span>Status</span>
          <span />
        </div>

        {offers.map((offer) => {
          const listing = getListing(offer.listingId);
          if (!listing || listing.type === 'auction') return null;
          const owner = getUser(listing.ownerId);
          const wanted =
            listing.type === 'sale' ? listing.item.name : listing.wants.name;
          const cash = cashLine(offer, listing, false).text;
          const badge = OFFER_BADGE[offer.state];

          const actions: MenuAction[] = [
            {
              label:
                offer.state === 'accepted' ? 'Contact them' : 'See the offer',
              icon:
                offer.state === 'accepted' ? (
                  <PhoneIcon size={17} />
                ) : (
                  <EyeIcon size={17} />
                ),
              onSelect: () => setOpenId(offer.id),
            },
            {
              label: 'See their request',
              icon: <EyeIcon size={17} />,
              href: `/listing/${listing.slug}`,
            },
          ];
          if (offer.state === 'pending') {
            actions.push({
              label: 'Withdraw',
              icon: <TrashIcon size={17} />,
              danger: true,
              onSelect: () => {
                void setOfferStateOptimistically(offer.id, 'withdrawn');
                toast('Offer withdrawn.');
              },
            });
          }

          return (
            <div key={offer.id} className={styles.row}>
              {/* The whole row opens the offer in full. */}
              <button
                type="button"
                className={styles.rowLink}
                aria-label={`Your offer to ${owner?.displayName ?? 'them'}`}
                onClick={() => setOpenId(offer.id)}
              />
              <span className={styles.request}>
                <span className={styles.requester}>
                  {owner?.displayName ?? 'Someone'} wants
                </span>
                <span className={styles.wanted}>{wanted}</span>
              </span>
              <span className={styles.offered}>{offer.item.name}</span>
              <span className={styles.cash}>{cash}</span>
              <span className={styles.when}>{offer.sentLabel}</span>
              <span className={styles.badge}>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </span>
              <span className={styles.action}>
                <ActionMenu label={`More for your offer on ${wanted}`} actions={actions} />
              </span>
              <span className={styles.phoneMeta}>
                {cash} · {offer.sentLabel}
              </span>
            </div>
          );
        })}
      </div>

      {open ? (
        <Sheet title="Your offer" onClose={() => setOpenId(null)}>
          <OfferCard offer={open} view="made" />
        </Sheet>
      ) : null}
    </>
  );
}
