'use client';

/**
 * A free store's own page, opened from My stores: a store with no pass has
 * no Store console, so its listings are looked after here
 * (docs/product/accounts-and-stores.md, "When a pass ends"). Its listings
 * as in My listings (GET /api/me/listings?store=<id>), each opening to its
 * page with the tools to pause, mark sold, edit or delete it; for the
 * owner, Get a store pass and Edit store details. A store with a pass opens
 * its Store console from My stores instead, and from here too.
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { statusOf, useListingStatusStore, useSessionStore, type Listing } from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  ListingCard,
  Screen,
  ScreenBody,
  SignInGate,
  Stack,
  SwapCardSkeleton,
  WantedCardSkeleton,
} from '@snt/ui';
import { StatusTag } from '@/components/listing/OwnerTools';
import { StorePassSheet } from '@/components/StorePassSheet';
import { apiGet, QueryProblem } from '@/lib/query';
import listStyles from '../../listings/page.module.css';
import styles from '../page.module.css';

export default function MyStorePage({ id }: { id: string }) {
  const viewer = useSessionStore((state) => state.viewer);
  const store = viewer?.stores.find((s) => s.id === id);
  const owner = store?.role === 'owner';
  const [buying, setBuying] = useState(false);
  const changes = useListingStatusStore((state) => state.changes);

  const listings = useQuery({
    queryKey: ['me', viewer?.id, 'store', id, 'listings'],
    queryFn: () =>
      apiGet<{ listings: Listing[] }>(`/me/listings?store=${encodeURIComponent(id)}`).then((data) => data.listings),
    enabled: Boolean(store),
  });
  // Deleted ones are gone for good, and staff removals are not listed here.
  const shown = (listings.data ?? []).filter((listing) => {
    const status = statusOf(listing, changes);
    return status !== 'withdrawn' && status !== 'removed';
  });

  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>{store?.name ?? 'My store'}</h1>
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          {viewer && !store ? (
            <Stack gap={6}>
              <p className={styles.none}>This store is not one of yours.</p>
              <ButtonLink href="/me/stores" variant="secondary" block>
                Back to My stores
              </ButtonLink>
            </Stack>
          ) : (
            <Stack gap={6}>
              {store ? (
                <p className={styles.lead}>
                  {store.paidUntil
                    ? `Paid until ${store.paidUntil}.`
                    : owner
                      ? 'A free store: up to 15 listings live. A store pass opens the Store console and lifts the limit.'
                      : 'A free store: up to 15 listings live. The Store console opens once the owner gets a store pass.'}
                </p>
              ) : null}
              {store?.paidUntil ? (
                <ButtonLink href={`/console/stock?store=${store.id}`} block>
                  Open Store console
                </ButtonLink>
              ) : owner && store ? (
                <div className={styles.actions}>
                  <Button onClick={() => setBuying(true)}>Get a store pass</Button>
                  <ButtonLink href={`/store/${store.slug}/edit`} variant="secondary">
                    Edit store details
                  </ButtonLink>
                </div>
              ) : null}

              <h2 className={styles.section}>Its listings</h2>
              {listings.isError ? (
                <QueryProblem error={listings.error} onRetry={() => void listings.refetch()} />
              ) : !listings.data ? (
                <div className={listStyles.list}>
                  <WantedCardSkeleton />
                  <SwapCardSkeleton />
                </div>
              ) : shown.length ? (
                <div className={listStyles.list}>
                  {shown.map((listing) =>
                    statusOf(listing, changes) === 'live' ? (
                      <ListingCard key={listing.id} listing={listing} />
                    ) : (
                      // Paused, sold or expired: said over the card, which
                      // is dimmed a little, as it is not in the feed.
                      <div key={listing.id} className={listStyles.down}>
                        <StatusTag listing={listing} />
                        <div className={listStyles.downCard}>
                          <ListingCard listing={listing} />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className={styles.none}>Nothing listed in this store yet.</p>
              )}

              <ButtonLink href="/me/stores" variant="secondary" block>
                Back to My stores
              </ButtonLink>
            </Stack>
          )}
        </SignInGate>
      </ScreenBody>
      {buying && store ? <StorePassSheet store={store} onClose={() => setBuying(false)} /> : null}
    </Screen>
  );
}
