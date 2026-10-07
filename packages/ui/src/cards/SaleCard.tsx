/**
 * SaleCard.
 *
 * One component, two presentations. Pass a `shop` and it renders the dealer
 * variant: a rule, then a shop row with the shop's mark, name, verified badge
 * and stock count. Leave it off and it renders as a private seller, with a
 * single trust line instead.
 */

import Link from 'next/link';
import type { SaleListing, Shop, User } from '@snt/core';
import { CARD_CONDITION } from '../format';
import { Badge } from '../primitives/Badge';
import { PhotoGallery } from '../primitives/PhotoGallery';
import { ShopMark } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { ItemName, Meta, Price } from '../primitives/Text';
import { specParts } from '../primitives/SpecGrid';
import { ConfirmedDealsBadge, VerifiedDealerBadge } from '../primitives/Trust';
import { CardActions } from './CardActions';
import { SellerIcon } from './SellerIcon';
import styles from './SaleCard.module.css';

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
  const condition = listing.item.condition
    ? CARD_CONDITION[listing.item.condition]
    : undefined;
  const href = `/listing/${listing.slug}`;

  return (
    <div className={styles.card}>
      <Panel xl clip>
        <div className={styles.imageWrap}>
          <PhotoGallery
            images={listing.item.images}
            alt={listing.item.name}
            tone={shop ? 'shop' : 'person'}
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
              on the right. An item with no specs would leave the left empty
              under its name, so there the condition takes that place. */}
          {/* The link covers the whole card (see .link in the CSS); the photo
              sits above it and opens the photo viewer, and save and share sit
              above it in the bottom row. */}
          <Link href={href} className={[styles.summary, styles.link].join(' ')}>
            <div className={styles.identity}>
              <ItemName side="owned" bold className={styles.name}>
                {listing.item.name}
              </ItemName>
              {specs.length > 0 ? (
                <div className={styles.specs}>{specs.join(' · ')}</div>
              ) : condition ? (
                <div className={styles.specs}>{condition}</div>
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
              {condition && specs.length > 0 ? (
                <Meta xs>{condition}</Meta>
              ) : null}
            </div>
          </Link>

          {shop ? (
            <div className={styles.shopRow}>
              {/* A shop has a page of its own, so its picture and its name
                  open it — and say so on hover, by turning blue. A private
                  seller has none; their name is just a name. The picture is
                  a second way to the same place, so only the name is a stop
                  for the keyboard and for screen readers. */}
              <Link
                href={`/shop/${shop.slug}`}
                className={[styles.shopLink, styles.shopMark].join(' ')}
                tabIndex={-1}
                aria-hidden
              >
                <ShopMark initials={shop.initials} size={40} />
              </Link>
              <span className={styles.shopIdentity}>
                <Link
                  href={`/shop/${shop.slug}`}
                  className={[styles.shopLink, styles.shopName].join(' ')}
                >
                  <SellerIcon kind="shop" />
                  {shop.name}
                </Link>
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
                  <span className={styles.sellerName}>
                    <SellerIcon kind="person" />
                    {seller.displayName}
                  </span>
                  <ConfirmedDealsBadge count={seller.confirmedDeals} />
                </>
              ) : null}
              <span className={styles.where}>
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
