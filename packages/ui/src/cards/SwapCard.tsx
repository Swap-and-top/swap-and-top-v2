/**
 * SwapCard — the signature card.
 *
 * Two tiles side by side. On the left, in brand blue, what they have — with
 * the cash they add on top. On the right, in brand green, what they are
 * looking for. The two colours are the swap: a stranger reads "this for that,
 * plus cash" in one glance, even from a screenshot in WhatsApp.
 */

import Link from 'next/link';
import type { Item, SwapListing, User } from '@snt/core';
import { ImagePlaceholder } from '../primitives/Placeholder';
import { specParts } from '../primitives/SpecGrid';
import { Panel } from '../primitives/Surface';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { CardActions } from './CardActions';
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
        {/* The link covers the whole card (see .link in the CSS); save and
            share sit above it in the footer. */}
        <Link href={href} className={styles.link}>
          <SwapTiles
            has={listing.has}
            wants={listing.wants}
            cashAmount={listing.cashAmount}
            tileHeight={tileHeight}
          />
        </Link>

        <div className={styles.footer}>
          {seller ? (
            <>
              <span className={styles.name}>{seller.displayName}</span>
              <ConfirmedDealsBadge count={seller.confirmedDeals} />
            </>
          ) : null}
          <span>
            {listing.location} · {listing.postedLabel}
          </span>
          <span className={styles.spacer} />
          <CardActions
            listingId={listing.id}
            href={href}
            title={listing.title}
          />
        </div>
      </Panel>
    </div>
  );
}

/** What a tile needs to know about one side of the swap. */
export type SwapSide = Pick<Item, 'name' | 'category' | 'specs'>;

/**
 * The two tiles on their own — for the swap detail screen and the posting
 * flow's preview. Pass `flush` to drop the card padding around them.
 */
export function SwapTiles({
  has,
  wants,
  cashAmount,
  tileHeight,
  flush = false,
}: {
  has: SwapSide;
  wants: SwapSide;
  /** The cash the poster adds on top, shown on the "has" tile. */
  cashAmount?: number;
  tileHeight?: number;
  flush?: boolean;
}) {
  const cash = cashAmount ? `+$${cashAmount}` : undefined;

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
        cash={cash}
        imageHeight={tileHeight}
      />
      <SwapTile
        tone="wants"
        label="Looking for"
        item={wants}
        imageHeight={tileHeight}
      />
    </div>
  );
}

function SwapTile({
  tone,
  label,
  item,
  cash,
  imageHeight,
}: {
  tone: 'has' | 'wants';
  label: string;
  item: SwapSide;
  cash?: string;
  imageHeight?: number;
}) {
  const specs = specParts(item);

  return (
    <div className={[styles.tile, styles[tone]].join(' ')}>
      <ImagePlaceholder height={imageHeight ?? 'var(--swap-image-h)'} flush />
      <div className={styles.caption}>
        <div className={styles.captionText}>
          <div className={styles.label}>{label}</div>
          <div className={styles.itemName}>{item.name}</div>
          {specs.length > 0 ? (
            <div className={styles.specs}>{specs.join(' · ')}</div>
          ) : null}
        </div>
        {cash ? <span className={styles.cash}>{cash}</span> : null}
      </div>
    </div>
  );
}
