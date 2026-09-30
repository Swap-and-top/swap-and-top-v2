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
import { PhotoGallery } from '../primitives/PhotoGallery';
import { ShopMark } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { ItemName, Meta, Price } from '../primitives/Text';
import { specParts } from '../primitives/SpecGrid';
import { ConfirmedDealsBadge, VerifiedDealerBadge } from '../primitives/Trust';
import { CardActions } from './CardActions';
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
  const href = `/listing/${listing.slug}`;

  return (
    <div className={styles.card}>
      <Panel xl clip>
        <div className={styles.imageWrap}>
          <PhotoGallery
            images={listing.item.images}
            alt={listing.item.name}
            height={imageHeight}
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
          {/* Name and specs on the left; price and condition balance them
              on the right. */}
          {/* The link covers the whole card (see .link in the CSS); the photo
              sits above it and opens the photo viewer, and save and share sit
              above it in the bottom row. */}
          <Link href={href} className={[styles.summary, styles.link].join(' ')}>
            <div className={styles.identity}>
              <ItemName side="owned" className={styles.name}>
                {listing.item.name}
              </ItemName>
              {specs.length > 0 ? (
                <div className={styles.specs}>{specs.join(' · ')}</div>
              ) : null}
            </div>

            <div className={styles.pricing}>
              <div className={styles.priceLine}>
                {/* A price drop shows the old price struck through, beside
                    the current one. */}
                {dropped ? (
                  <s className={styles.wasPrice}>
                    <span className="snt-visually-hidden">Was </span>
                    {`$${listing.previousPrice}`}
                  </s>
                ) : null}
                <Price amount={listing.price} />
              </div>
              {listing.item.condition ? (
                <Meta xs>{CARD_CONDITION[listing.item.condition]}</Meta>
              ) : null}
            </div>
          </Link>

          {shop ? (
            <div className={styles.shopRow}>
              <ShopMark initials={shop.initials} size={40} />
              <span className={styles.shopIdentity}>
                <span className={styles.shopName}>{shop.name}</span>
                {shop.verified ? <VerifiedDealerBadge /> : null}
              </span>
              <span className={styles.spacer} />
              {/* Stock count above the save and share icons. */}
              <span className={styles.shopAside}>
                {listing.stockCount && listing.stockCount > 1 ? (
                  <span className={styles.stock}>
                    {listing.stockCount} in Stock
                  </span>
                ) : null}
                <CardActions
                  listingId={listing.id}
                  href={href}
                  title={listing.title}
                />
              </span>
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
              <span className={styles.spacer} />
              <CardActions
                listingId={listing.id}
                href={href}
                title={listing.title}
              />
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
