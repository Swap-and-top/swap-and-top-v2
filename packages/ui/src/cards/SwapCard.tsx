/**
 * SwapCard — the signature card.
 *
 * `has` on the left with a photo, `wants` on the right with a dashed border and
 * no photo, the cash amount between them. The dashed border is load-bearing: it
 * is how a stranger understands in one second that the right-hand side is a
 * wish rather than a possession.
 */

import Link from 'next/link';
import type { SwapListing, User } from '@snt/core';
import { SwapIcon } from '../icons';
import { ImagePlaceholder } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { CashAmount, Eyebrow } from '../primitives/Text';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import styles from './SwapCard.module.css';

export function SwapCard({
  listing,
  seller,
  tileHeight = 72,
}: {
  listing: SwapListing;
  seller?: User;
  tileHeight?: number;
}) {
  return (
    <Link href={`/listing/${listing.slug}`} className={styles.card}>
      <Panel xl clip>
        <div className={styles.strip}>
          <SwapIcon size={14} weight={2} />
          Swap &amp; Top
        </div>

        <div className={styles.tiles}>
          {/* What they have. Photographed, because a counterparty judges it. */}
          <div className={styles.tile}>
            <ImagePlaceholder height={tileHeight} small />
            <Eyebrow tight className={styles.tileEyebrow}>
              Has
            </Eyebrow>
            <div className={styles.tileName}>{listing.has.name}</div>
          </div>

          <div className={styles.middle}>
            <span className={styles.arrows}>
              <SwapIcon size={17} weight={2.1} />
            </span>
            {listing.cashAmount ? (
              <CashAmount amount={listing.cashAmount} />
            ) : null}
          </div>

          {/* What they want. Dashed, and never photographed. */}
          <div className={styles.tile}>
            <ImagePlaceholder height={tileHeight} small wanted glyph="search" />
            <Eyebrow tight accent className={styles.tileEyebrow}>
              Wants
            </Eyebrow>
            <div className={styles.tileName}>{listing.wants.name}</div>
          </div>
        </div>

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
        </div>
      </Panel>
    </Link>
  );
}
