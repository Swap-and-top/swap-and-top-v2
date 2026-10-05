'use client';

/**
 * Search results — the full list for a search, laid out like the feed: the
 * search bar, a heading that names the search with a "Filters" button beside
 * it, then the matching cards.
 *
 * The filters — category, listing type and a price range — open under the
 * heading and start closed. They narrow the list in place and are kept in the
 * address, so a refresh or a shared link lands on the same results. Tapping
 * the pill reopens the full-screen search to change the words.
 */

import { useEffect, useState } from 'react';
import {
  liveListings,
  NO_SPEC_FILTERS,
  searchListings,
} from '@snt/core';
import {
  AppHeader,
  BottomNav,
  ButtonLink,
  EmptyState,
  ListingCard,
  Screen,
  ScreenBody,
} from '@snt/ui';
import { SearchEntry } from '../../components/SearchEntry';
import {
  QuotedQuery,
  SearchFilters,
  type SearchFilterValues,
} from '../../components/SearchFilters';
import { searchHref, type SearchQuery } from '../../components/searchParams';
import styles from './page.module.css';

export function SearchResults({ initial }: { initial: SearchQuery }) {
  const [filters, setFilters] = useState<SearchFilterValues>({
    category: initial.category,
    type: initial.type,
    min: initial.min,
    max: initial.max,
  });
  const { category, type, min, max } = filters;
  /** The filters start closed: the results come first. */
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Keep the address in step, in place — narrowing is not a new history entry.
  useEffect(() => {
    const next = searchHref({ q: initial.q, category, type, min, max });
    const current = window.location.pathname + window.location.search;
    if (next !== current) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [initial.q, category, type, min, max]);

  const results = searchListings(
    liveListings.filter((listing) => type === 'all' || listing.type === type),
    {
      ...NO_SPEC_FILTERS,
      query: initial.q,
      category,
      minPrice: min,
      maxPrice: max,
    },
  );

  return (
    <Screen>
      <AppHeader>
        <SearchEntry
          query={initial.q}
          category={category}
          type={type}
          min={min}
          max={max}
        />
      </AppHeader>

      <ScreenBody>
        <div className={styles.heading}>
          <SearchFilters
            heading={
              initial.q ? (
                <>
                  Search results for <QuotedQuery q={initial.q} bold />
                </>
              ) : (
                'All listings'
              )
            }
            count={results.length}
            open={filtersOpen}
            onToggle={() => setFiltersOpen((current) => !current)}
            values={filters}
            onChange={(change) =>
              setFilters((current) => ({ ...current, ...change }))
            }
          />
        </div>

        {results.length > 0 ? (
          <div className={styles.feed}>
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          // A dead end becomes a lead.
          <EmptyState
            title="Nothing matched"
            body="Try another category, widen the price range, or post what you are looking for and let sellers come to you."
            action={
              // Green like the post button in the bottom menu, no border.
              <ButtonLink href="/post" variant="primary">
                Post what you are looking for
              </ButtonLink>
            }
          />
        )}
      </ScreenBody>

      <BottomNav />
    </Screen>
  );
}
