'use client';

/**
 * WantedCard — demand, from either source.
 *
 * Takes a `DemandListing`, so a request and a swap-seen-as-demand render through
 * the same card. A swap arrives with a trade-in strip, which is what makes it
 * the higher-value lead.
 *
 * Note the structure differs from the wireframe in one way: the card is not one
 * big link. A `<button>` cannot live inside an `<a>` — it is invalid HTML and
 * the anchor swallows the click. So the title is the link, stretched over the
 * whole card so a tap anywhere opens the request, and "I have this" is a real
 * sibling button sitting above it, which opens the offer sheet.
 */

import Link from 'next/link';
import { offerCountFor, useOfferStore, useViewerId } from '@snt/core';
import type { DemandListing, User } from '@snt/core';
import { BinocularsIcon, SwapIcon } from '../icons';
import { OfferButton } from '../offers/OfferButton';
import {
  OwnerOfferCount,
  UnlessOwnerOfferCount,
} from '../offers/OwnerOfferCount';
import { PhotoThumb } from '../primitives/PhotoGallery';
import { Panel } from '../primitives/Surface';
import { CashAmount, Eyebrow, ItemName } from '../primitives/Text';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { swapTerms } from '../format';
import { CardActions } from './CardActions';
import { SellerIcon } from './SellerIcon';
import styles from './WantedCard.module.css';

export function WantedCard({
  listing,
  requester,
}: {
  listing: DemandListing;
  requester?: User;
}) {
  const offers = useOfferStore((store) => store.offers);
  /** Your own post: no button to offer, its offers counted under you. */
  const own = listing.ownerId === useViewerId();
  // A swap shown as demand: what they have is the trade-in. A plain request
  // has none: it is cash only.
  const tradeIn = listing.type === 'swap' ? listing.has : undefined;
  const terms =
    listing.type === 'swap'
      ? swapTerms(
          listing.cashDirection,
          listing.cashAmount,
          false,
          listing.cashUpTo,
        )
      : undefined;
  const cashUpTo = listing.type === 'swap' && Boolean(listing.cashUpTo);
  // The cash rides with what they have only when they are the ones adding it.
  const cash =
    listing.type === 'swap' && terms?.cashSide === 'has'
      ? listing.cashAmount
      : undefined;
  const wantedName =
    listing.type === 'swap' ? listing.wants.name : listing.wants.name;
  const responses = offerCountFor(
    offers,
    listing.id,
    listing.type === 'swap' ? listing.offerCount : listing.responseCount,
  );

  return (
    <Panel xl className={styles.card}>
      <div className={styles.head}>
        <span
          className={[styles.label, tradeIn ? styles.labelTradeIn : '']
            .filter(Boolean)
            .join(' ')}
        >
          {/* Each word carries its mark, outlined on a small pale tile:
              binoculars for a thing looked for, the swap arrows for a swap
              offered with it. */}
          <span className={styles.labelIcon}>
            <BinocularsIcon size={14} />
          </span>
          Wanted
          {tradeIn ? (
            <>
              <span aria-hidden>+</span>
              <span className={styles.labelIcon}>
                <SwapIcon size={14} />
              </span>
              Swap
            </>
          ) : null}
        </span>
        <span className={styles.spacer} />
        {/* The small grey facts sit together, top right. On your own post
            only when: its offers are counted under your name. */}
        <span className={styles.age}>
          {responses > 0 && !own
            ? `${responses} ${responses === 1 ? 'response' : 'responses'} · `
            : ''}
          {listing.postedLabel}
        </span>
      </div>

      {/* What they want on the left; the button on the right, where it
          balances the text instead of sitting under it. */}
      <div className={styles.main}>
        <div className={styles.info}>
          <Link href={`/listing/${listing.slug}`} className={styles.title}>
            {wantedName}
          </Link>

          <div className={styles.sub}>
            {listing.type === 'request' ? (
              <>
                <span>{listing.location}</span>
                <span>Budget up to ${listing.budget}</span>
              </>
            ) : (
              <>
                <span>{listing.location}</span>
                <span>{terms?.cashNote}</span>
              </>
            )}
          </div>
        </div>

        {/* Opens the offer sheet. Not on your own post: the card itself
            leads to it and its offers. */}
        {own ? null : <OfferButton listing={listing} className={styles.cta} />}
      </div>

      {tradeIn ? (
        <div className={styles.tradeIn}>
          {/* What they are offering is theirs, so it can be pictured; what
              they want never is. Opens the viewer on the Wanted green. */}
          <PhotoThumb
            images={tradeIn.images ?? []}
            alt={tradeIn.name}
            tone="wanted"
          />
          <div className={styles.tradeInBody}>
            <Eyebrow tight>Has</Eyebrow>
            <ItemName side="owned" bold className={styles.tradeInName}>
              {tradeIn.name}
            </ItemName>
          </div>
          {cash && cashUpTo ? (
            // "+ up to $600": cash on top, capped rather than fixed.
            <span className={styles.upTo}>
              <span className={styles.upToWords}>+ up to</span> ${cash}
            </span>
          ) : cash ? (
            <CashAmount amount={cash} />
          ) : null}
        </div>
      ) : null}

      {/* Who is asking, then save and share far right — the same bottom row
          as the sale and swap cards, so the icons are always in one place. */}
      <div className={styles.footer}>
        {requester ? (
          <>
            <span className={styles.requesterName}>
              <SellerIcon kind="person" />
              {requester.displayName}
            </span>
            <ConfirmedDealsBadge count={requester.confirmedDeals} />
          </>
        ) : null}
        <span className={styles.spacer} />
        <UnlessOwnerOfferCount listing={listing}>
          <CardActions
            listingId={listing.id}
            href={`/listing/${listing.slug}`}
            title={listing.title}
            tone="wanted"
          />
        </UnlessOwnerOfferCount>
      </div>

      {/* Your own: how many offers it has had, under your name, the icons
          beside it in the bottom corner. */}
      <OwnerOfferCount listing={listing} className={styles.ownerOffers}>
        <CardActions
          listingId={listing.id}
          href={`/listing/${listing.slug}`}
          title={listing.title}
          tone="wanted"
        />
      </OwnerOfferCount>
    </Panel>
  );
}
