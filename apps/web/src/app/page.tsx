'use client';

/**
 * Browse — the feed.
 *
 * One stream carrying every listing type, filtered by two chip rows: category,
 * then transaction type. There are no separate pages for sale, swap and wanted;
 * thin inventory split three ways produces three dead-looking feeds.
 *
 * Wireframe artboard: `Main`.
 */

import Link from 'next/link';
import {
  CATEGORY_LABELS,
  filterFeed,
  interleaveSponsored,
  liveListings,
  pendingConfirmationCount,
  useFeedStore,
  type Category,
  type TypeFilter,
} from '@snt/core';
import {
  AppHeader,
  BottomNav,
  ButtonLink,
  Chip,
  ChipRow,
  EmptyState,
  ListingCard,
  Screen,
  ScreenBody,
  Stack,
} from '@snt/ui';
import { SearchIcon } from '@snt/ui/icons';
import styles from './page.module.css';

const CATEGORIES: (Category | 'all')[] = [
  'all',
  'phones',
  'laptops',
  'desktops',
  'consoles',
  'parts',
  'accessories',
];

const TYPES: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'sale', label: 'For sale' },
  { value: 'swap', label: 'Swaps' },
  { value: 'request', label: 'Wanted' },
];

export default function BrowsePage() {
  const { category, type, setCategory, setType, reset } = useFeedStore();

  const filtered = filterFeed(liveListings, { category, type });
  /** Sponsored listings are interleaved and labelled, never sorted to the top. */
  const feed = interleaveSponsored(filtered);

  return (
    <Screen>
      <AppHeader />

      <div className={styles.filters}>
        <Link href="/search" className={styles.searchEntry}>
          <SearchIcon size={17} />
          <span>Search phones, laptops, consoles, parts</span>
        </Link>

        <div className={styles.categoryRow}>
          <ChipRow label="Filter by category">
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
        </div>
      </div>

      <div className={styles.typeRow}>
        <ChipRow label="Filter by listing type">
          {TYPES.map((item) => (
            <Chip
              key={item.value}
              small
              tone="ink"
              selected={type === item.value}
              onClick={() => setType(item.value)}
            >
              {item.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <ScreenBody top={false}>
        {feed.length > 0 ? (
          <Stack gap={6}>
            {feed.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </Stack>
        ) : (
          <EmptyState
            title="Nothing here yet"
            body="No listings match those filters. Clear them, or post what you are looking for and let dealers come to you."
            action={
              <ButtonLink href="/post" variant="secondary" onClick={reset}>
                Post what you want
              </ButtonLink>
            }
          />
        )}
      </ScreenBody>

      <BottomNav pendingConfirmations={pendingConfirmationCount} />
    </Screen>
  );
}
