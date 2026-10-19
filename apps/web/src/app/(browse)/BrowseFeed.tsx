'use client';

/**
 * Browse — the feed.
 *
 * One stream carrying every listing type, narrowed by a scrolling category chip
 * row and then by listing type. There are no separate pages for sale, swap
 * and wanted; thin inventory split three ways produces three dead-looking
 * feeds — the types switch the view over one feed, they do not switch route.
 *
 * The four types are a tab row above the listings from tablet up, where it
 * sticks to the top as the feed scrolls. On a phone they are the bottom bar
 * instead, and the tab row is not shown.
 *
 * Design: the one page of `Swap & Top v2 Design.pdf`.
 */

import { useEffect, useRef, useState } from 'react';
import {
  CATEGORY_LABELS,
  filterFeed,
  interleaveSponsored,
  useLiveListings,
  useViewerId,
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
import { BinocularsIcon, GridIcon, SwapIcon, TagIcon } from '@snt/ui/icons';
import type { FeedFilterParams } from '@/components/feedFilterParams';
import { SearchEntry } from '@/components/SearchEntry';
import { useFeedFiltersInUrl } from '@/components/useFeedFiltersInUrl';
import styles from './page.module.css';

export const CATEGORIES: (Category | 'all')[] = [
  'all',
  'phones',
  'laptops',
  'desktops',
  'consoles',
  'parts',
  'accessories',
  'other',
];

export const TYPES: TabItem<TypeFilter>[] = [
  // The same icons as the bottom bar that carries these on a phone; the
  // active tab's is filled in. The swap arrows have no inside to fill, so
  // they go heavier instead.
  {
    value: 'all',
    label: 'All Types',
    icon: (active) => <GridIcon size={18} filled={active} />,
  },
  {
    value: 'swap',
    label: 'Swaps',
    icon: (active) => <SwapIcon size={18} weight={active ? 2.6 : 1.9} />,
  },
  {
    value: 'sale',
    label: 'For Sale',
    icon: (active) => <TagIcon size={18} filled={active} />,
  },
  {
    value: 'request',
    label: 'Wanted',
    icon: (active) => <BinocularsIcon size={18} filled={active} />,
  },
];

/** The feed. Its server half, page.tsx, reads the filters from the address. */
export function BrowseFeed({ initial }: { initial: FeedFilterParams }) {
  // The type and category live in the address too, so a refresh keeps them.
  const { category, type, setCategory, setType, reset } =
    useFeedFiltersInUrl(initial);
  const stickyTop = useStickyTabsOffset();

  const viewer = useViewerId();
  // Your own listings are not in your feed: they are under My listings.
  const live = useLiveListings();
  const others = live.filter((listing) => listing.ownerId !== viewer);
  const filtered = filterFeed(others, { category, type });
  /** Sponsored listings are interleaved and labelled, never sorted to the top. */
  const feed = interleaveSponsored(filtered);

  return (
    <Screen>
      {/* Search, category and type sit under the brand header. From tablet up
          the whole block sticks, pulled up so only the type tabs stay in view
          while the feed scrolls. On a phone it scrolls away: the types are in
          the bottom bar. */}
      <div
        ref={stickyTop.ref}
        className={styles.stickyHeader}
        style={{ top: stickyTop.offset }}
      >
        <AppHeader>
          {/* Opens the full-screen search over this page. */}
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

          {/* Type is a tab bar, not a chip row: the four values are exhaustive
              and mutually exclusive, so they should read as one control
              switching the view rather than as four independent toggles.
              Hidden on a phone, where the bottom bar carries them. */}
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
              <ButtonLink href="/post" variant="primary" onClick={reset}>
                Post what you are looking for
              </ButtonLink>
            }
          />
        )}
      </ScreenBody>

      {/* On a phone the listing types are here, not in the tab row. */}
      <BottomNav type={type} onType={setType} />
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
