'use client';

/**
 * Browse — the feed.
 *
 * One stream carrying every listing type, narrowed by a scrolling category chip
 * row and then by a type tab bar. There are no separate pages for sale, swap
 * and wanted; thin inventory split three ways produces three dead-looking
 * feeds — the tabs switch the view over one feed, they do not switch route.
 *
 * Design: the one page of `Swap & Top v2 Design.pdf`.
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
  Tabs,
  type TabItem,
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

const TYPES: TabItem<TypeFilter>[] = [
  { value: 'all', label: 'All Types' },
  { value: 'swap', label: 'Swaps' },
  { value: 'sale', label: 'For Sale' },
  { value: 'request', label: 'Wanted' },
];

export default function BrowsePage() {
  const { category, type, setCategory, setType, reset } = useFeedStore();

  const filtered = filterFeed(liveListings, { category, type });
  /** Sponsored listings are interleaved and labelled, never sorted to the top. */
  const feed = interleaveSponsored(filtered);

  return (
    <Screen>
      {/* Search, category and type all live in the brand header, as drawn. */}
      <AppHeader>
        <Link href="/search" className={styles.searchEntry}>
          <SearchIcon size={18} />
          <span>Search phone, laptops, consoles, parts, accessories</span>
        </Link>

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

        {/* Type is a tab bar, not a chip row: the four values are exhaustive
            and mutually exclusive, so they should read as one control
            switching the view rather than as four independent toggles. */}
        <Tabs
          fill
          tabs={TYPES}
          active={type}
          onChange={setType}
          label="Filter by listing type"
        />
      </AppHeader>

      <ScreenBody>
        {feed.length > 0 ? (
          <div className={styles.feed}>
            {feed.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
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
