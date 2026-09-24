/**
 * SaleCard.
 *
 * One component, two presentations. Pass a `shop` and it renders the dealer
 * variant with a shop row, verified badge and stock count. Leave it off and it
 * renders as a private seller.
 */

import Link from 'next/link';
import type { SaleListing, Shop, User } from '@snt/core';
import { CONDITION_LABELS } from '@snt/core';
import { Badge } from '../primitives/Badge';
import { ImagePlaceholder, ShopMark } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { Meta, Price } from '../primitives/Text';
import { specSummary } from '../primitives/SpecGrid';
import { ConfirmedDealsBadge, VerifiedDealerBadge } from '../primitives/Trust';
import styles from './SaleCard.module.css';

export interface SaleCardProps {
  listing: SaleListing;
  /** Present for a dealer listing. Drives the shop row. */
  shop?: Shop;
  /** Present for a private seller. Drives the trust line. */
  seller?: User;
  imageHeight?: number;
}

export function SaleCard({
  listing,
  shop,
  seller,
  imageHeight = 122,
}: SaleCardProps) {
  const dropped =
    listing.previousPrice !== undefined && listing.previousPrice > listing.price;

  return (
    <Link href={`/listing/${listing.slug}`} className={styles.card}>
      <Panel xl clip>
        <div className={styles.imageWrap}>
          <ImagePlaceholder height={imageHeight} flush />
          {/* Paid placement is always labelled, never hidden. */}
          {listing.promotion === 'sponsored' ? (
            <Badge tone="dark" onImage>
              Sponsored
            </Badge>
          ) : null}
          {listing.promotion === 'drop' ? (
            <Badge tone="accentSolid" onImage>
              Friday drop
            </Badge>
          ) : null}
        </div>

        <div className={styles.body}>
          <div className={styles.priceRow}>
            <Price amount={listing.price} />
            {listing.item.condition ? (
              <Meta>{CONDITION_LABELS[listing.item.condition]}</Meta>
            ) : null}
            {dropped ? (
              <Badge tone="accent">
                Dropped ${listing.previousPrice! - listing.price}
              </Badge>
            ) : null}
          </div>

          <div className={styles.specLine}>{specSummary(listing.item)}</div>

          {shop ? (
            <div className={styles.shopRow}>
              <ShopMark initials={shop.initials} />
              <span className={styles.shopName}>{shop.name}</span>
              {shop.verified ? <VerifiedDealerBadge /> : null}
              <span className={styles.spacer} />
              {listing.stockCount && listing.stockCount > 1 ? (
                <span className={styles.stock}>
                  {listing.stockCount} in stock
                </span>
              ) : null}
            </div>
          ) : (
            <div className={styles.sellerLine}>
              {seller ? (
                <>
                  <span className={styles.sellerName}>{seller.displayName}</span>
                  <ConfirmedDealsBadge count={seller.confirmedDeals} />
                </>
              ) : null}
              <span>
                {listing.location} · {listing.postedLabel}
              </span>
            </div>
          )}
        </div>
      </Panel>
    </Link>
  );
}
