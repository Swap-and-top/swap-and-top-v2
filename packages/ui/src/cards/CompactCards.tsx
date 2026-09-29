/**
 * CompactListingRow and GridCard.
 *
 * Reduced forms of the same cards, for Saved lists and the shopfront grid.
 */

import Link from 'next/link';
import type { Listing } from '@snt/core';
import { getShop, getUser } from '@snt/core';
import { SwapIcon } from '../icons';
import { Badge } from '../primitives/Badge';
import { ImagePlaceholder } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { CashAmount, Price } from '../primitives/Text';
import { specSummary } from '../primitives/SpecGrid';
import styles from './CompactCards.module.css';

function isGone(listing: Listing): boolean {
  return (
    listing.status === 'sold' ||
    listing.status === 'withdrawn' ||
    listing.status === 'expired'
  );
}

/** Horizontal line item. Used by Saved. */
export function CompactListingRow({ listing }: { listing: Listing }) {
  const gone = isGone(listing);
  const shop = getShop(listing.shopId);
  const owner = getUser(listing.ownerId);

  const dropped =
    listing.type === 'sale' &&
    listing.previousPrice !== undefined &&
    listing.previousPrice > listing.price;

  return (
    <Panel>
      <Link
        href={`/listing/${listing.slug}`}
        className={[styles.row, gone ? styles.rowGone : '']
          .filter(Boolean)
          .join(' ')}
      >
        <ImagePlaceholder
          height={74}
          width={74}
          small
          className={[
            styles.thumb,
            // A request has no photo: its slot is brand green, like the
            // "Looking for" side of a swap.
            listing.type === 'request' ? styles.thumbWanted : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        <div className={styles.rowBody}>
          <div className={styles.rowTop}>
            {listing.type === 'sale' ? <Price amount={listing.price} size="sm" /> : null}

            {listing.type === 'swap' && listing.cashAmount ? (
              <span className={styles.swapAmount}>
                <SwapIcon size={13} weight={2.1} />
                <CashAmount amount={listing.cashAmount} />
              </span>
            ) : null}

            {listing.type === 'request' ? (
              <Price amount={listing.budget} size="sm" />
            ) : null}

            {dropped && listing.type === 'sale' ? (
              <Badge tone="accent">
                Dropped ${listing.previousPrice! - listing.price}
              </Badge>
            ) : null}

            {gone ? <Badge tone="neutral">Gone</Badge> : null}
          </div>

          <div className={styles.rowTitle}>
            {listing.type === 'swap'
              ? `${listing.has.name} for ${listing.wants.name}`
              : listing.type === 'request'
                ? listing.wants.name
                : specSummary(listing.item)}
          </div>

          <div className={styles.rowMeta}>
            {shop?.name ?? owner?.displayName ?? 'Unknown seller'} ·{' '}
            {gone ? listing.postedLabel : listing.location}
          </div>
        </div>
      </Link>
    </Panel>
  );
}

/** Two-up grid of small cards. Used by the shopfront. */
export function GridCardList({ listings }: { listings: Listing[] }) {
  return (
    <div className={styles.gridWrap}>
      {listings.map((listing) => (
        <GridCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export function GridCard({ listing }: { listing: Listing }) {
  const price =
    listing.type === 'sale'
      ? listing.price
      : listing.type === 'request'
        ? listing.budget
        : undefined;

  return (
    <Link href={`/listing/${listing.slug}`} className={styles.grid}>
      <Panel clip>
        <ImagePlaceholder height={82} flush small />
        <div className={styles.gridBody}>
          {price !== undefined ? <Price amount={price} size="sm" /> : null}
          {listing.type === 'swap' && listing.cashAmount ? (
            <CashAmount amount={listing.cashAmount} />
          ) : null}
          <div className={styles.gridTitle}>
            {listing.type === 'sale'
              ? specSummary(listing.item, 2)
              : listing.title}
          </div>
        </div>
      </Panel>
    </Link>
  );
}
