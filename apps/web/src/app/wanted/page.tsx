'use client';

/**
 * Wanted — demand.
 *
 * Top-level navigation on purpose: this is the dealer product and the platform's
 * structural difference from a supply-only board like Facebook Marketplace.
 * Burying it inside search would hide the thing that makes the business work.
 *
 * Both sources of demand appear here — requests, and swaps seen from their
 * "wants" side. A swap arrives with a trade-in attached, which makes it the
 * higher-value lead.
 *
 * Wireframe artboard: `Wanted`.
 */

import {
  CATEGORY_LABELS,
  getUser,
  isDemand,
  liveListings,
  pendingConfirmationCount,
  useFeedStore,
  type Category,
} from '@snt/core';
import {
  Band,
  BottomNav,
  ButtonLink,
  Chip,
  ChipRow,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenTitle,
  Stack,
  WantedCard,
} from '@snt/ui';
import { PlusIcon } from '@snt/ui/icons';
import styles from './page.module.css';

const CATEGORIES: (Category | 'all')[] = [
  'all',
  'laptops',
  'phones',
  'desktops',
  'consoles',
  'parts',
];

export default function WantedPage() {
  const { category, setCategory } = useFeedStore();

  const demand = liveListings
    .filter(isDemand)
    .filter((listing) => category === 'all' || listing.category === category);

  return (
    <Screen>
      <Band tight>
        <ScreenTitle>Wanted</ScreenTitle>
        <div className={styles.subtitle}>
          People looking to buy or swap right now
        </div>
      </Band>

      <div className={styles.chipRow}>
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

      <ScreenBody>
        {demand.length > 0 ? (
          <Stack gap={5}>
            {demand.map((listing) => (
              <WantedCard
                key={listing.id}
                listing={listing}
                requester={getUser(listing.ownerId)}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState
            title="No requests in this category"
            body="Nobody is looking for one of these right now. Post what you want and dealers will come to you."
          />
        )}
      </ScreenBody>

      <div className={styles.postPrompt}>
        <ButtonLink href="/post" variant="dashed" size="lg" block>
          <PlusIcon size={17} />
          Post what you are looking for
        </ButtonLink>
      </div>

      <BottomNav pendingConfirmations={pendingConfirmationCount} />
    </Screen>
  );
}
