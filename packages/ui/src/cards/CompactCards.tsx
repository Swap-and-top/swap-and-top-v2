/**
 * CompactListingRow and GridCard.
 *
 * Reduced forms of the same cards, for Saved lists and the shopfront grid.
 */

import Link from 'next/link';
import type { Listing } from '@snt/core';
import { getShop, getUser } from '@snt/core';
import { PersonIcon, StorefrontIcon, SwapIcon } from '../icons';
import { Badge } from '../primitives/Badge';
import { ImagePlaceholder, listingPhoto } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { CashAmount, ItemName, Price } from '../primitives/Text';
import { specParts } from '../primitives/SpecGrid';
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
    <Panel className={styles.rowPanel}>
      <Link
        href={`/listing/${listing.slug}`}
        className={[styles.row, gone ? styles.rowGone : '']
          .filter(Boolean)
          .join(' ')}
      >
        <ImagePlaceholder
          src={listingPhoto(listing)}
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
          {/* The item first, in bold; then what it costs; then who has it. */}
          <div className={styles.rowTitle}>
            <ListingName listing={listing} bold />
          </div>

          <div className={styles.rowTop}>
            {listing.type === 'sale' ? (
              <>
                {/* A price drop shows the old price struck through, beside
                    the current one. */}
                {dropped ? (
                  <s className={styles.wasPrice}>
                    <span className="snt-visually-hidden">Was </span>
                    {`$${listing.previousPrice}`}
                  </s>
                ) : null}
                <Price amount={listing.price} size="sm" />
              </>
            ) : null}

            {listing.type === 'swap' && listing.cashAmount ? (
              <span className={styles.swapAmount}>
                <SwapIcon size={13} weight={2.1} />
                <CashAmount amount={listing.cashAmount} />
              </span>
            ) : null}

            {listing.type === 'request' ? (
              <Price amount={listing.budget} size="sm" />
            ) : null}

            {gone ? <Badge tone="neutral">Gone</Badge> : null}
          </div>

          <div className={styles.rowMeta}>
            {/* Who is selling: a shop or dealer, or a person. */}
            <strong className={styles.seller}>
              {shop ? (
                <StorefrontIcon size={15} weight={1.9} title="Shop" />
              ) : (
                <PersonIcon size={15} weight={1.9} title="Person" />
              )}
              {shop?.name ?? owner?.displayName ?? 'Unknown seller'}
            </strong>{' '}
            · {gone ? listing.postedLabel : listing.location}
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
        <ImagePlaceholder src={listingPhoto(listing)} height={82} flush small />
        <div className={styles.gridBody}>
          {price !== undefined ? <Price amount={price} size="sm" /> : null}
          {listing.type === 'swap' && listing.cashAmount ? (
            <CashAmount amount={listing.cashAmount} />
          ) : null}
          <div className={styles.gridTitle}>
            <ListingName listing={listing} specLimit={2} />
          </div>
        </div>
      </Panel>
    </Link>
  );
}

/**
 * A listing's name in a compact card, with the item names coloured by side —
 * blue for owned, green for wanted — and a sale's specs trailing in grey.
 */
function ListingName({
  listing,
  specLimit = 3,
  bold = false,
}: {
  listing: Listing;
  specLimit?: number;
  /** Item names in bold; the words and specs around them stay as they are. */
  bold?: boolean;
}) {
  const name = bold ? styles.nameBold : undefined;

  switch (listing.type) {
    case 'swap':
      return (
        <>
          <ItemName side="owned" bold={bold} className={name}>
            {listing.has.name}
          </ItemName>{' '}
          for{' '}
          <ItemName side="wanted" className={name}>
            {listing.wants.name}
          </ItemName>
        </>
      );
    case 'request':
      return (
        <ItemName side="wanted" className={name}>
          {listing.wants.name}
        </ItemName>
      );
    case 'sale':
    case 'auction': {
      const specs = specParts(listing.item, specLimit);
      return (
        <>
          <ItemName side="owned" bold={bold} className={name}>
            {listing.item.name}
          </ItemName>
          {specs.length > 0 ? (
            <span className={styles.specs}> · {specs.join(' · ')}</span>
          ) : null}
        </>
      );
    }
  }
}
