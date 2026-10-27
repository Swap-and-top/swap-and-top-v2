'use client';

/**
 * Shopfront.
 *
 * The trust statistics are stock count, confirmed deals and typical reply time.
 * The confirmed-deal count replaced the year the shop joined: a deal count is a
 * far stronger signal than a date.
 *
 * Wireframe artboard: `Shopfront`.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  CATEGORY_LABELS,
  type Category,
  type Listing,
  type Shop,
} from '@snt/core';
import {
  AppHeader,
  Bone,
  Button,
  GridCardList,
  GridCardListSkeleton,
  Screen,
  ScreenBody,
  ShopMark,
  StatStrip,
  StatStripSkeleton,
  Tabs,
  VerifiedDealerBadge,
  replyShort,
  type TabItem,
} from '@snt/ui';
import { ShareIcon } from '@snt/ui/icons';
import { RevealAction } from './RevealAction';
import styles from './Shopfront.module.css';

type ShopTab = Category | 'all';

export function Shopfront({
  shop,
  listings,
}: {
  shop: Shop;
  listings: Listing[];
}) {
  return (
    <Screen>
      {/* The feed's own header, as on every page. */}
      <AppHeader />

      <ScreenBody>
        <ShopfrontBody shop={shop} listings={listings} />
      </ScreenBody>
    </Screen>
  );
}

/**
 * The shop itself, without the page around it: on the public shopfront under
 * the feed's header, and in the dealer console beside its sidebar.
 */
export function ShopfrontBody({
  shop,
  listings,
}: {
  shop: Shop;
  listings: Listing[];
}) {
  const [tab, setTab] = useState<ShopTab>('all');

  const categories = Array.from(
    new Set(listings.map((listing) => listing.category)),
  );

  const tabs: TabItem<ShopTab>[] = [
    { value: 'all', label: 'All', count: listings.length },
    ...categories.map((category) => ({
      value: category as ShopTab,
      label: CATEGORY_LABELS[category],
      count: listings.filter((l) => l.category === category).length,
    })),
  ];

  const shown =
    tab === 'all'
      ? listings
      : listings.filter((listing) => listing.category === tab);

  /** The phone's own share sheet where there is one, a copied link if not. */
  async function share() {
    // The shop's public address, wherever it is shared from.
    const url = `${window.location.origin}/shop/${shop.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shop.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  return (
    <>
      {/* The shop: one white card, as the profile page is. */}
      <section className={styles.card}>
        <div className={styles.head}>
          <ShopMark initials={shop.initials} size={56} />
          <div className={styles.headBody}>
            <h1 className={styles.name}>{shop.name}</h1>
            {shop.verified ? (
              <div className={styles.badgeRow}>
                <VerifiedDealerBadge size="md" label="Verified dealer" />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.share}
            aria-label="Share store"
            onClick={() => void share()}
          >
            <ShareIcon size={18} />
          </button>
        </div>

        <p className={styles.description}>
          {shop.description}
          <br />
          {shop.location} · {shop.openingHours}
        </p>

        <StatStrip
          stats={[
            { value: shop.stockCount, label: 'in stock' },
            {
              value: shop.confirmedDeals,
              label: 'deals confirmed',
              tone: 'trust',
            },
            { value: replyShort(shop.replyHours), label: 'replies in' },
          ]}
        />

        {/* Two actions, half each. */}
        <div className={styles.actions}>
          <RevealAction listingId={`shop-${shop.id}`} ownerId="u-kopje" />
          <Button variant="secondary" size="lg" block>
            Follow
          </Button>
        </div>
      </section>

      <div className={styles.tabs}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Store stock" />
      </div>

      <div className={styles.grid}>
        <GridCardList listings={shown} />
      </div>
    </>
  );
}

/**
 * The shop while it loads, built from its own styles: the card with its mark,
 * name and badge, the description, the numbers with their labels, the two
 * buttons, then the tabs and the stock grid. For the public page and the
 * console's Shop profile alike.
 */
export function ShopfrontBodySkeleton() {
  return (
    <div aria-busy aria-label="Loading the store">
      <section className={styles.card}>
        <div className={styles.head}>
          <Bone shape="block" width={56} height={56} />
          <div className={styles.headBody}>
            <Bone width="55%" height={22} />
            <Bone width={110} height={14} style={{ marginTop: 8 }} />
          </div>
          <Bone shape="circle" width={36} height={36} />
        </div>
        <div>
          <Bone width="80%" height={14} />
          <Bone width="55%" height={14} style={{ marginTop: 9 }} />
        </div>
        <StatStripSkeleton labels={['in stock', 'deals confirmed', 'replies in']} />
        {/* As the real pair: one over the other on a phone, since the
            contact button carries its icons. */}
        <div className={styles.actions}>
          <Bone shape="pill" height={48} data-stack-on-phone="" />
          <Bone shape="pill" height={48} />
        </div>
      </section>

      <div className={[styles.tabs, styles.tabsLoading].join(' ')} aria-hidden>
        <Bone width={50} height={14} />
        <Bone width={80} height={14} />
        <Bone width={70} height={14} />
      </div>

      <div className={styles.grid}>
        <GridCardListSkeleton count={4} />
      </div>
    </div>
  );
}

/** The public shop page while it loads: the feed's header, then the shop. */
export function ShopfrontSkeleton() {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <ShopfrontBodySkeleton />
      </ScreenBody>
    </Screen>
  );
}
