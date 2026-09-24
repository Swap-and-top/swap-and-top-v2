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
import {
  CATEGORY_LABELS,
  type Category,
  type Listing,
  type Shop,
} from '@snt/core';
import {
  Button,
  GridCardList,
  Screen,
  ScreenBody,
  ScreenHeader,
  ShopMark,
  StatStrip,
  Tabs,
  VerifiedDealerBadge,
  replyShort,
  type TabItem,
} from '@snt/ui';
import { HeaderIconButton } from '@snt/ui';
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
  const [tab, setTab] = useState<ShopTab>('all');

  const categories = Array.from(
    new Set(listings.map((listing) => listing.category)),
  );

  const tabs: TabItem<ShopTab>[] = [
    { value: 'all', label: `All ${listings.length}` },
    ...categories.map((category) => ({
      value: category as ShopTab,
      label: `${CATEGORY_LABELS[category]} ${
        listings.filter((l) => l.category === category).length
      }`,
    })),
  ];

  const shown =
    tab === 'all'
      ? listings
      : listings.filter((listing) => listing.category === tab);

  return (
    <Screen>
      <ScreenHeader
        backHref="/"
        actions={
          <HeaderIconButton label="Share shop">
            <ShareIcon size={20} />
          </HeaderIconButton>
        }
      />

      <div className={styles.identity}>
        <div className={styles.head}>
          <ShopMark initials={shop.initials} size={56} />
          <div className={styles.headBody}>
            <div className={styles.name}>{shop.name}</div>
            {shop.verified ? (
              <div className={styles.badgeRow}>
                <VerifiedDealerBadge size="md" label="Verified dealer" />
              </div>
            ) : null}
          </div>
        </div>

        <p className={styles.description}>
          {shop.description}
          <br />
          {shop.location} · {shop.openingHours}
        </p>

        <StatStrip
          className={styles.stats}
          stats={[
            { value: shop.stockCount, label: 'in stock' },
            {
              value: shop.confirmedDeals,
              label: 'deals confirmed',
              tone: 'success',
            },
            { value: replyShort(shop.replyHours), label: 'replies in' },
          ]}
        />

        <div className={styles.actions}>
          <RevealAction listingId={`shop-${shop.id}`} ownerId="u-kopje" />
          <Button variant="secondary">Follow</Button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} label="Shop stock" />

      <ScreenBody top={false}>
        <div className={styles.grid}>
          <GridCardList listings={shown} />
        </div>
      </ScreenBody>
    </Screen>
  );
}
