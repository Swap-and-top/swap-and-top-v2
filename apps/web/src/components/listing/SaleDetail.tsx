'use client';

/**
 * Sale listing detail.
 *
 * The specification grid is the part a buyer actually reads, and it is what the
 * search filters were built against — showing specs in the same shape they are
 * filtered in reinforces the platform's one real advantage.
 *
 * Wireframe artboard: `DetailDealer`.
 */

import Link from 'next/link';
import {
  CONDITION_LABELS,
  getShop,
  getUser,
  type SaleListing,
} from '@snt/core';
import {
  AppHeader,
  Badge,
  Button,
  Caption,
  CardActions,
  ImageCarousel,
  ItemName,
  PosterRow,
  Price,
  Screen,
  ScreenBody,
  ScreenFooter,
  ShopRow,
  SpecGrid,
  specRowsFor,
} from '@snt/ui';
import { MessageIcon, SwapIcon } from '@snt/ui/icons';
import { RevealAction } from '../RevealAction';
import styles from './SaleDetail.module.css';

export function SaleDetail({ listing }: { listing: SaleListing }) {
  const shop = getShop(listing.shopId);
  const owner = getUser(listing.ownerId);

  const dropped =
    listing.previousPrice !== undefined && listing.previousPrice > listing.price;

  return (
    <Screen surface>
      {/* The same header as the feed, so the site does not change face on
          the way into a listing. Save and share are in the page. */}
      <AppHeader />

      <ImageCarousel
        images={listing.item.images}
        alt={listing.item.name}
        tone={shop ? 'shop' : 'person'}
      />

      <ScreenBody>
        <div className={styles.priceRow}>
          <Price amount={listing.price} size="lg" />
          {listing.item.condition ? (
            <Badge tone="outline" pill>
              {CONDITION_LABELS[listing.item.condition]}
            </Badge>
          ) : null}
          {dropped ? (
            <Badge tone="accent" size="lg">
              Dropped ${listing.previousPrice! - listing.price}
            </Badge>
          ) : null}
          {/* Save and share, under the photo at the right, level with the
              price. */}
          <span className={styles.actions}>
            <CardActions
              listingId={listing.id}
              href={`/listing/${listing.slug}`}
              title={listing.title}
              report
            />
          </span>
        </div>

        <h1 className={styles.title}>
          <ItemName side="owned">{listing.item.name}</ItemName>
        </h1>
        <div className={styles.meta}>
          {listing.location} · Listed {listing.postedLabel}
          {listing.negotiable ? ' · negotiable' : ''}
        </div>

        <div className={styles.specs}>
          <SpecGrid rows={specRowsFor(listing.item)} />
        </div>

        <div className={styles.identity}>
          {shop ? <ShopRow shop={shop} /> : owner ? <PosterRow user={owner} /> : null}
        </div>

        {/* Turns a purchase intent into swap demand. */}
        <Link href="/post" className={styles.tradePrompt}>
          <SwapIcon size={18} weight={2} />
          Got something to trade in? Ask for a swap price
        </Link>
      </ScreenBody>

      <ScreenFooter
        caption={
          <Caption>
            No account needed · meet in public, check the device before paying
          </Caption>
        }
      >
        <RevealAction listingId={listing.id} ownerId={listing.ownerId} />
        <Button variant="secondary" size="lg" iconOnly aria-label="Message on WhatsApp">
          <MessageIcon size={20} />
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
