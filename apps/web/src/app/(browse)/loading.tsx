'use client';

/**
 * Loading: the feed. The header is the feed's own, set to the category and
 * type already chosen, so nothing in it moves when the listings arrive. Under
 * it, cards in bones of the kind on show: swap cards for Swaps, sale cards
 * for For Sale, wanted cards for Wanted, and a mix for All.
 */

import { CATEGORY_LABELS, useFeedStore } from '@snt/core';
import {
  AppHeader,
  BottomNav,
  Chip,
  ChipRow,
  SaleCardSkeleton,
  Screen,
  ScreenBody,
  SwapCardSkeleton,
  Tabs,
  WantedCardSkeleton,
} from '@snt/ui';
import { SearchEntry } from '@/components/SearchEntry';
import { CATEGORIES, TYPES } from './BrowseFeed';
import styles from './page.module.css';

const CARDS = {
  all: [WantedCardSkeleton, SaleCardSkeleton, SwapCardSkeleton],
  sale: [SaleCardSkeleton],
  swap: [SwapCardSkeleton],
  request: [WantedCardSkeleton],
} as const;

export default function Loading() {
  const { category, type, setCategory, setType } = useFeedStore();
  const kinds = CARDS[type];

  return (
    <Screen>
      <div className={styles.stickyHeader}>
        <AppHeader>
          <SearchEntry />
          <ChipRow fill label="Filter by category">
            {CATEGORIES.map((value) => (
              <Chip
                key={value}
                selected={category === value}
                onClick={() => setCategory(value)}
              >
                {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
              </Chip>
            ))}
          </ChipRow>
          <Tabs
            fill
            tabs={TYPES}
            active={type}
            onChange={setType}
            label="Filter by listing type"
          />
        </AppHeader>
      </div>

      <ScreenBody>
        <div className={styles.feed} aria-busy aria-label="Loading listings">
          {Array.from({ length: 4 }).map((_, i) => {
            const Card = kinds[i % kinds.length]!;
            return <Card key={i} />;
          })}
        </div>
      </ScreenBody>

      <BottomNav type={type} onType={setType} />
    </Screen>
  );
}
