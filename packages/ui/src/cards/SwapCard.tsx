/**
 * SwapCard — the signature card.
 *
 * Two tiles side by side. On the left, in brand blue, what they have — with
 * the cash they add on top. On the right, in brand green, what they are
 * looking for. The two colours are the swap: a stranger reads "this for that,
 * plus cash" in one glance, even from a screenshot in WhatsApp.
 */

import Link from 'next/link';
import type { CashDirection, Item, SwapListing, User } from '@snt/core';
import { swapTerms } from '../format';
import { CategoryIcon } from '../icons';
import { PhotoGallery } from '../primitives/PhotoGallery';
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
    // Swaps are always between individuals, so the card is always tinted blue.
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
          tileHeight={tileHeight}
        />

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
export type SwapSide = Pick<Item, 'name' | 'category' | 'specs'> &
  Partial<Pick<Item, 'images'>>;

/**
 * The two tiles on their own — for the swap detail screen and the posting
 * flow's preview. Pass `flush` to drop the card padding around them.
 */
export function SwapTiles({
  has,
  wants,
  cashAmount,
  cashDirection = 'i-add',
  tileHeight,
  flush = false,
}: {
  has: SwapSide;
  wants: SwapSide;
  /** The cash on top. */
  cashAmount?: number;
  /** Which side the cash comes with — see `swapTerms`. */
  cashDirection?: CashDirection;
  tileHeight?: number;
  flush?: boolean;
}) {
  const cash = cashAmount ? `+$${cashAmount}` : undefined;
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
        imageHeight={tileHeight}
      />
      <SwapTile
        tone="wants"
        label="Looking for"
        item={wants}
        cash={cashSide === 'wants' ? cash : undefined}
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
        {cash ? <span className={styles.cash}>{cash}</span> : null}
      </div>
    </div>
  );
}
