/**
 * SwapCard — the signature card.
 *
 * Two tiles side by side. On the left, in brand blue, what they have — with
 * the cash they add on top. On the right, in brand green, what they are
 * looking for. The two colours are the swap: a stranger reads "this for that,
 * plus cash" in one glance, even from a screenshot in WhatsApp.
 */

import Link from 'next/link';
import { contactAfterOffer } from '@snt/core';
import type { CashDirection, Item, SwapListing, User } from '@snt/core';
import { CARD_CONDITION, swapTerms } from '../format';
import { CategoryIcon, MegaphoneIcon } from '../icons';
import { Badge } from '../primitives/Badge';
import { PhotoGallery } from '../primitives/PhotoGallery';
import { specParts } from '../primitives/SpecGrid';
import { Panel } from '../primitives/Surface';
import {
  OwnerOfferCount,
  UnlessOwnerOfferCount,
} from '../offers/OwnerOfferCount';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { CardActions } from './CardActions';
import { SellerIcon } from './SellerIcon';
import styles from './SwapCard.module.css';

export function SwapCard({
  listing,
  seller,
  tileHeight,
}: {
  listing: SwapListing;
  seller?: User;
  /** Overrides the photo height inside each tile. */
  tileHeight?: number;
}) {
  const href = `/listing/${listing.slug}`;

  return (
    <div className={styles.card}>
      <Panel xl>
        {/* The link covers the whole card (see .link in the CSS). The photos
            sit above it and open the photo viewer; save and share sit above
            it too. It is empty, so its name is the listing's title. */}
        <Link href={href} className={styles.link} aria-label={listing.title} />

        <SwapTiles
          has={listing.has}
          wants={listing.wants}
          cashAmount={listing.cashAmount}
          cashDirection={listing.cashDirection}
          cashUpTo={listing.cashUpTo}
          tileHeight={tileHeight}
          sponsored={listing.promotion === 'sponsored'}
        />

        <div className={styles.footer}>
          {seller ? (
            <>
              <span className={styles.name}>
                <SellerIcon kind="person" />
                {seller.displayName}
              </span>
              <ConfirmedDealsBadge count={seller.confirmedDeals} />
            </>
          ) : null}
          <span className={styles.where}>
            {listing.location} · {listing.postedLabel}
          </span>
          {/* Contact only after an accepted offer: said up front. Its own
              piece, never trimmed: the place and age give way first. */}
          {contactAfterOffer(listing) ? (
            <span className={styles.offersOnly}>· Offers only</span>
          ) : null}
          <span className={styles.spacer} />
          <UnlessOwnerOfferCount listing={listing}>
            <CardActions
              listingId={listing.id}
              href={href}
              title={listing.title}
            />
          </UnlessOwnerOfferCount>
        </div>

        {/* Your own: how many offers it has had, under your name, the icons
            beside it in the bottom corner. */}
        <OwnerOfferCount listing={listing} className={styles.ownerOffers}>
          <CardActions listingId={listing.id} href={href} title={listing.title} />
        </OwnerOfferCount>
      </Panel>
    </div>
  );
}

/** What a tile needs to know about one side of the swap. */
export type SwapSide = Pick<Item, 'name' | 'category' | 'specs'> &
  Partial<Pick<Item, 'images' | 'condition'>>;

/**
 * The two tiles on their own — for the swap detail screen and the posting
 * flow's preview. Pass `flush` to drop the card padding around them.
 */
export function SwapTiles({
  has,
  wants,
  cashAmount,
  cashDirection = 'i-add',
  cashUpTo = false,
  tileHeight,
  flush = false,
  sponsored = false,
}: {
  has: SwapSide;
  wants: SwapSide;
  /** The cash on top. */
  cashAmount?: number;
  /** Which side the cash comes with — see `swapTerms`. */
  cashDirection?: CashDirection;
  /** The cash is a ceiling: "up to +$600". */
  cashUpTo?: boolean;
  tileHeight?: number;
  flush?: boolean;
  /** Paid placement: "Sponsored" in the card's top right corner, on the
      Looking for tile, as on a sale's photo. */
  sponsored?: boolean;
}) {
  // A ceiling reads "+ up to $600", the "+ up to" small. A set amount is
  // "+$600".
  const cash = cashAmount
    ? cashUpTo
      ? `$${cashAmount}`
      : `+$${cashAmount}`
    : undefined;
  const { cashSide } = swapTerms(cashDirection, cashAmount);

  return (
    <div
      className={[styles.tiles, flush ? styles.tilesFlush : '']
        .filter(Boolean)
        .join(' ')}
    >
      <SwapTile
        tone="has"
        label="Has"
        item={has}
        cash={cashSide === 'has' ? cash : undefined}
        cashUpTo={cashUpTo}
        imageHeight={tileHeight}
      />
      <SwapTile
        tone="wants"
        label="Looking for"
        item={wants}
        cash={cashSide === 'wants' ? cash : undefined}
        imageHeight={tileHeight}
        sponsored={sponsored}
      />
    </div>
  );
}

function SwapTile({
  tone,
  label,
  item,
  cash,
  cashUpTo = false,
  imageHeight,
  sponsored = false,
}: {
  tone: 'has' | 'wants';
  label: string;
  item: SwapSide;
  cash?: string;
  /** The cash is a ceiling: shown as "up to $600". */
  cashUpTo?: boolean;
  imageHeight?: number;
  sponsored?: boolean;
}) {
  const specs = specParts(item);
  const condition = item.condition ? CARD_CONDITION[item.condition] : undefined;

  return (
    <div className={[styles.tile, styles[tone]].join(' ')}>
      {/* Paid placement is always labelled, never hidden: in the card's
          top right corner, as on a sale's photo. */}
      {sponsored ? (
        <Badge tone="brand" onImage>
          <MegaphoneIcon size={12} weight={2.2} />
          Sponsored
        </Badge>
      ) : null}
      {/* What they have is photographed. What they want is described, never
          pictured, so its slot is grey with the category's icon in green. */}
      {tone === 'has' ? (
        <PhotoGallery
          images={item.images ?? []}
          alt={item.name}
          tone="person"
          height={imageHeight ?? 'var(--swap-image-h)'}
        />
      ) : (
        <div
          className={styles.wantedSlot}
          style={{ height: imageHeight ?? 'var(--swap-image-h)' }}
        >
          <CategoryIcon category={item.category} size={40} weight={1.4} />
        </div>
      )}
      <div className={styles.caption}>
        <div className={styles.captionText}>
          <div className={styles.label}>{label}</div>
          <div className={styles.itemName}>{item.name}</div>
          {specs.length > 0 ? (
            <div className={styles.specs}>{specs.join(' · ')}</div>
          ) : null}
        </div>
        {/* As on a sale card: the amount, and the condition under it. With
            no cash on this side, the condition stands there alone. */}
        {cash || condition ? (
          <div className={styles.terms}>
            {cash ? (
              <span className={styles.cash}>
                {cashUpTo ? <span className={styles.upTo}>+ up to </span> : null}
                {cash}
              </span>
            ) : null}
            {condition ? (
              <span className={styles.condition}>{condition}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
