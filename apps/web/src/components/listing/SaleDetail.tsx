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
  useSavedStore,
  type SaleListing,
} from '@snt/core';
import {
  Badge,
  Button,
  Caption,
  HeaderIconButton,
  ImageCarousel,
  ItemName,
  PosterRow,
  Price,
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  ShopRow,
  SpecGrid,
  specRowsFor,
} from '@snt/ui';
import {
  MessageIcon,
  SaveStarIcon,
  ShareIcon,
  SwapIcon,
} from '@snt/ui/icons';
import { RevealAction } from '../RevealAction';
import styles from './SaleDetail.module.css';

export function SaleDetail({ listing }: { listing: SaleListing }) {
  const shop = getShop(listing.shopId);
  const owner = getUser(listing.ownerId);
  const { ids, toggle } = useSavedStore();
  const saved = ids.includes(listing.id);

  const dropped =
    listing.previousPrice !== undefined && listing.previousPrice > listing.price;

  return (
    <Screen surface>
      <ScreenHeader
        backHref="/"
        actions={
          <>
            <HeaderIconButton
              label={saved ? 'Remove from wish list' : 'Add to wish list'}
              onClick={() => toggle(listing.id)}
            >
              <SaveStarIcon size={20} filled={saved} />
            </HeaderIconButton>
            <HeaderIconButton label="Share on WhatsApp">
              <ShareIcon size={20} />
            </HeaderIconButton>
          </>
        }
      />

      <ImageCarousel count={listing.item.images.length || 1} />

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
