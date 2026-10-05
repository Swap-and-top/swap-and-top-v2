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

import { useEffect, useRef, useState } from 'react';
import {
  CATEGORY_LABELS,
  filterFeed,
  interleaveSponsored,
  liveListings,
  pendingConfirmationCount,
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
import type { FeedFilterParams } from '../components/feedFilterParams';
import { SearchEntry } from '../components/SearchEntry';
import { useFeedFiltersInUrl } from '../components/useFeedFiltersInUrl';
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

/** The feed. Its server half, page.tsx, reads the filters from the address. */
export function BrowseFeed({ initial }: { initial: FeedFilterParams }) {
  // The type and category live in the address too, so a refresh keeps them.
  const { category, type, setCategory, setType, reset } =
    useFeedFiltersInUrl(initial);
  const stickyTop = useStickyTabsOffset();

  const filtered = filterFeed(liveListings, { category, type });
  /** Sponsored listings are interleaved and labelled, never sorted to the top. */
  const feed = interleaveSponsored(filtered);

  return (
    <Screen>
      {/* Search, category and type sit on white under the brand header. On a
          phone the whole block sticks, pulled up so only the type tabs stay in
          view while the feed scrolls. */}
      <div
        ref={stickyTop.ref}
        className={styles.stickyHeader}
        style={{ top: stickyTop.offset }}
      >
        <AppHeader>
          {/* Opens the full-screen search over this page. */}
          <SearchEntry />

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
      </div>

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
                Post what you are looking for
              </ButtonLink>
            }
          />
        )}
      </ScreenBody>

      <BottomNav pendingConfirmations={pendingConfirmationCount} />
    </Screen>
  );
}

/**
 * How far to pull the sticky header up so that only its type tabs — and a
 * little room above them — remain on screen. Re-measured whenever the
 * header changes size, e.g. on rotation.
 */
function useStickyTabsOffset() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const wrapper = ref.current;
    const tabs = wrapper?.querySelector<HTMLElement>('[role="tablist"]');
    if (!wrapper || !tabs) return;

    const measure = () => {
      const breathingRoom = 8;
      const tabsTop =
        tabs.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;
      setOffset(-Math.max(0, tabsTop - breathingRoom));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return { ref, offset };
}
