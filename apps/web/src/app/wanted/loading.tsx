'use client';

/**
 * Loading: Wanted. The heading and category chips are the page's own, set to
 * the category in the address; under them, wanted cards in bones, then the
 * post prompt and the bottom bar as on the page.
 */

import { useSearchParams } from 'next/navigation';
import { CATEGORY_LABELS } from '@snt/core';
import {
  AppHeader,
  BottomNav,
  Bone,
  Chip,
  ChipRow,
  Screen,
  ScreenBody,
  ScreenTitle,
  Stack,
  WantedCardSkeleton,
} from '@snt/ui';
import { parseFeedFilterParams } from '@/components/feedFilterParams';
import { CATEGORIES } from './WantedFeed';
import styles from './page.module.css';

export default function Loading() {
  const params = useSearchParams();
  const { category } = parseFeedFilterParams(
    Object.fromEntries(params.entries()),
  );

  return (
    <Screen>
      <AppHeader>
        <div>
          <ScreenTitle>Wanted</ScreenTitle>
          <div className={styles.subtitle}>
            People looking to buy or swap right now
          </div>
        </div>
        <ChipRow fill label="Filter by category">
          {CATEGORIES.map((value) => (
            <Chip key={value} selected={category === value}>
              {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
            </Chip>
          ))}
        </ChipRow>
      </AppHeader>

      <ScreenBody>
        <Stack gap={8}>
          {Array.from({ length: 4 }).map((_, i) => (
            <WantedCardSkeleton key={i} />
          ))}
        </Stack>
      </ScreenBody>

      <div className={styles.postPrompt}>
        <Bone shape="pill" height={52} />
      </div>

      <BottomNav />
    </Screen>
  );
}
