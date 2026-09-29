/**
 * SaleCard.
 *
 * One component, two presentations. Pass a `shop` and it renders the dealer
 * variant: a rule, then a shop row with the shop's mark, name, verified badge
 * and stock count. Leave it off and it renders as a private seller, with a
 * single trust line instead.
 */

import Link from 'next/link';
import type { Condition, SaleListing, Shop, User } from '@snt/core';
import { Badge } from '../primitives/Badge';
import { ImagePlaceholder, ShopMark } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { ItemName, Meta, Price } from '../primitives/Text';
import { specParts } from '../primitives/SpecGrid';
import { ConfirmedDealsBadge, VerifiedDealerBadge } from '../primitives/Trust';
import styles from './SaleCard.module.css';

/** How a card words condition beside the price: "Used Good". */
const CARD_CONDITION: Record<Condition, string> = {
  'like-new': 'Like New',
  good: 'Used Good',
  fair: 'Used Fair',
  'for-parts': 'For Parts',
};

export interface SaleCardProps {
  listing: SaleListing;
  /** Present for a dealer listing. Drives the shop row. */
  shop?: Shop;
  /** Present for a private seller. Drives the trust line. */
  seller?: User;
  /** Fixes the photo height instead of the shared photo ratio. */
  imageHeight?: number;
}

export function SaleCard({ listing, shop, seller, imageHeight }: SaleCardProps) {
  const dropped =
    listing.previousPrice !== undefined && listing.previousPrice > listing.price;
  const specs = specParts(listing.item);

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className={styles.card}
    >
      <Panel xl clip>
        <div className={styles.imageWrap}>
          <ImagePlaceholder
            height={imageHeight ?? 'auto'}
            flush
            className={imageHeight ? undefined : styles.photo}
          />
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
              <Meta xs>{CARD_CONDITION[listing.item.condition]}</Meta>
            ) : null}
            {dropped ? (
              <Badge tone="accent">
                Dropped ${listing.previousPrice! - listing.price}
              </Badge>
            ) : null}
          </div>

          {/* Name on its own line, in the owned-item blue; specs under it. */}
          <ItemName side="owned" className={styles.name}>
            {listing.item.name}
          </ItemName>
          {specs.length > 0 ? (
            <div className={styles.specs}>{specs.join(' · ')}</div>
          ) : null}

          {shop ? (
            <div className={styles.shopRow}>
              <ShopMark initials={shop.initials} size={40} />
              <span className={styles.shopIdentity}>
                <span className={styles.shopName}>{shop.name}</span>
                {shop.verified ? <VerifiedDealerBadge /> : null}
              </span>
              <span className={styles.spacer} />
              {listing.stockCount && listing.stockCount > 1 ? (
                <span className={styles.stock}>
                  {listing.stockCount} in Stock
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
