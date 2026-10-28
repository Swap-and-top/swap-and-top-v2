'use client';

/**
 * Storefront.
 *
 * The trust statistics are stock count, confirmed deals and typical reply time.
 * The confirmed-deal count replaced the year the store joined: a deal count is a
 * far stronger signal than a date.
 *
 * Wireframe artboard: `Shopfront` (its name in the design file).
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  CATEGORY_LABELS,
  type Category,
  type Listing,
  type Store,
} from '@snt/core';
import {
  AppHeader,
  Bone,
  Button,
  GridCardList,
  GridCardListSkeleton,
  Screen,
  ScreenBody,
  StoreMark,
  StatStrip,
  StatStripSkeleton,
  Tabs,
  VerifiedStoreBadge,
  replyShort,
  type TabItem,
} from '@snt/ui';
import { ShareIcon } from '@snt/ui/icons';
import { RevealAction } from './RevealAction';
import styles from './Storefront.module.css';

type StoreTab = Category | 'all';

export function Storefront({
  store,
  listings,
}: {
  store: Store;
  listings: Listing[];
}) {
  return (
    <Screen>
      {/* The feed's own header, as on every page. */}
      <AppHeader />

      <ScreenBody>
        <StorefrontBody store={store} listings={listings} />
      </ScreenBody>
    </Screen>
  );
}

/**
 * The store itself, without the page around it: on the public storefront under
 * the feed's header, and in the Store console beside its sidebar.
 */
export function StorefrontBody({
  store,
  listings,
}: {
  store: Store;
  listings: Listing[];
}) {
  const [tab, setTab] = useState<StoreTab>('all');

  const categories = Array.from(
    new Set(listings.map((listing) => listing.category)),
  );

  const tabs: TabItem<StoreTab>[] = [
    { value: 'all', label: 'All', count: listings.length },
    ...categories.map((category) => ({
      value: category as StoreTab,
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
    // The store's public address, wherever it is shared from.
    const url = `${window.location.origin}/store/${store.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: store.name, url });
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
      {/* The store: one white card, as the profile page is. */}
      <section className={styles.card}>
        <div className={styles.head}>
          <StoreMark initials={store.initials} size={56} />
          <div className={styles.headBody}>
            <h1 className={styles.name}>{store.name}</h1>
            {/* For 30 days after a rename, so its record cannot be shed. */}
            {store.formerName ? (
              <p className={styles.former}>formerly {store.formerName}</p>
            ) : null}
            {store.verified ? (
              <div className={styles.badgeRow}>
                <VerifiedStoreBadge size="md" label="Verified store" />
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
          {store.description}
          <br />
          {/* A new store has no opening hours yet: just where it is. */}
          {store.openingHours ? `${store.location} · ${store.openingHours}` : store.location}
        </p>

        <StatStrip
          stats={[
            { value: store.stockCount, label: 'in stock' },
            {
              value: store.confirmedDeals,
              label: 'deals confirmed',
              tone: 'trust',
            },
            { value: replyShort(store.replyHours), label: 'replies in' },
          ]}
        />

        {/* Two actions, half each. */}
        <div className={styles.actions}>
          {/* The store's own number, else its owner's: calls and WhatsApp. */}
          <RevealAction
            listingId={`store-${store.id}`}
            ownerId="u-kopje"
            storeId={store.id}
            channels={['call', 'whatsapp']}
          />
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
 * The store while it loads, built from its own styles: the card with its mark,
 * name and badge, the description, the numbers with their labels, the two
 * buttons, then the tabs and the stock grid. For the public page and the
 * console's Store profile alike.
 */
export function StorefrontBodySkeleton() {
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

/** The public store page while it loads: the feed's header, then the store. */
export function StorefrontSkeleton() {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <StorefrontBodySkeleton />
      </ScreenBody>
    </Screen>
  );
}
