'use client';

/**
 * Loading: search results. The search bar and the results heading are the
 * page's own, already holding what was searched; a bar stands for the count,
 * and cards in bones for the results, of the kind searched for.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppHeader,
  BottomNav,
  SaleCardSkeleton,
  Screen,
  ScreenBody,
  SwapCardSkeleton,
  WantedCardSkeleton,
} from '@snt/ui';
import { SearchEntry } from '@/components/SearchEntry';
import {
  QuotedQuery,
  SearchFilters,
  type SearchFilterValues,
} from '@/components/SearchFilters';
import { parseSearchQuery } from '@/components/searchParams';
import styles from './page.module.css';

const CARDS = {
  all: [WantedCardSkeleton, SaleCardSkeleton, SwapCardSkeleton],
  sale: [SaleCardSkeleton],
  swap: [SwapCardSkeleton],
  request: [WantedCardSkeleton],
} as const;

export default function Loading() {
  const params = useSearchParams();
  const initial = parseSearchQuery(Object.fromEntries(params.entries()));
  const [values, setValues] = useState<SearchFilterValues>({
    category: initial.category,
    type: initial.type,
    min: initial.min,
    max: initial.max,
  });
  const kinds = CARDS[initial.type];

  return (
    <Screen>
      <AppHeader>
        <SearchEntry
          query={initial.q}
          category={initial.category}
          type={initial.type}
          min={initial.min}
          max={initial.max}
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
            count="loading"
            open={false}
            onToggle={() => {}}
            values={values}
            onChange={(change) => setValues((now) => ({ ...now, ...change }))}
          />
        </div>

        <div className={styles.feed} aria-busy aria-label="Loading results">
          {Array.from({ length: 4 }).map((_, i) => {
            const Card = kinds[i % kinds.length]!;
            return <Card key={i} />;
          })}
        </div>
      </ScreenBody>

      <BottomNav />
    </Screen>
  );
}
