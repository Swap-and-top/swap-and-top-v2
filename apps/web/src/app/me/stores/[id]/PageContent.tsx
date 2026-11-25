'use client';

/**
 * A free store's own page, opened from My stores: a store with no pass has
 * no Store console, so its listings are looked after here
 * (docs/product/accounts-and-stores.md, "When a pass ends"). Its listings
 * as in My listings (GET /api/me/listings?store=<id>), each opening to its
 * page with the tools to pause, mark sold, edit or delete it; for the
 * owner, Get a store pass and Edit store details. A store with a pass opens
 * its Store console from My stores instead, and from here too.
 *
 * Opening a store lands here: first Get a store pass (a free store's
 * owner), then Add a listing (posting as the store), Share store link and
 * View as buyer, and how many of its listings
 * are live against a free store's limit.
 */

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FREE_STORE_LIMIT,
  statusOf,
  useListingStatusStore,
  useSessionStore,
  type Listing,
} from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  ListingCard,
  Screen,
  ScreenBody,
  shareLink,
  SignInGate,
  Stack,
  startPageLoad,
  SwapCardSkeleton,
  WantedCardSkeleton,
} from '@snt/ui';
import { StatusTag } from '@/components/listing/OwnerTools';
import { StorePassSheet } from '@/components/StorePassSheet';
import { apiGet, QueryProblem } from '@/lib/query';
import { postStart } from '@/components/PostAs';
import listStyles from '../../listings/page.module.css';
import Loading from './loading';
import styles from '../page.module.css';

export default function MyStorePage({ id }: { id: string }) {
  const viewer = useSessionStore((state) => state.viewer);
  const store = viewer?.stores.find((s) => s.id === id);
  const owner = store?.role === 'owner';
  const [buying, setBuying] = useState(false);
  const changes = useListingStatusStore((state) => state.changes);
  const router = useRouter();

  /** Posting, as this store: chosen here, by pressing Add a listing. */
  function addItem() {
    if (!store) return;
    startPageLoad();
    router.push(postStart(store.id));
  }

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
  /** Live and for sale or swap: what the free store's limit counts. */
  /** Who they are, then the store's listings: the skeleton until both are
      in, then the page at once. */
  const signedIn = useSessionStore((state) => state.signedIn);
  const waiting = signedIn && (!viewer || (store && !listings.data && !listings.isError));
  const live = shown.filter(
    (listing) => statusOf(listing, changes) === 'live' && (listing.type === 'sale' || listing.type === 'swap'),
  ).length;

  if (waiting) return <Loading />;

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
                      ? `A free store: up to ${FREE_STORE_LIMIT} listings live. A store pass opens the Store console and lifts the limit.`
                      : `A free store: up to ${FREE_STORE_LIMIT} listings live. The Store console opens once the owner gets a store pass.`}
                </p>
              ) : null}
              {store ? (
                <>
                  {/* Get a store pass, what we most want a free store's owner
                      to do, first and in the brand gradient, beside Add a
                      listing; Add a listing alone for anyone else. */}
                  {owner && !store.paidUntil ? (
                    <div className={styles.actions}>
                      <Button className={styles.passButton} onClick={() => setBuying(true)}>
                        Get a store pass
                      </Button>
                      <Button onClick={addItem}>Add a listing</Button>
                    </div>
                  ) : (
                    <Button block onClick={addItem}>
                      Add a listing
                    </Button>
                  )}
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void shareLink({ title: store.name, url: `${window.location.origin}/store/${store.slug}` })
                      }
                    >
                      Share store link
                    </Button>
                    <ButtonLink href={`/store/${store.slug}`} variant="secondary">
                      View as buyer
                    </ButtonLink>
                  </div>
                </>
              ) : null}
              {store?.paidUntil ? (
                <ButtonLink href={`/console/stock?store=${store.id}`} variant="secondary" block>
                  Open Store console
                </ButtonLink>
              ) : owner && store ? (
                <ButtonLink href={`/store/${store.slug}/edit`} variant="secondary" block>
                  Edit store details
                </ButtonLink>
              ) : null}

              <h2 className={styles.section}>
                Its listings
                {store && !store.paidUntil && listings.data ? ` · ${live} of ${FREE_STORE_LIMIT} live` : ''}
              </h2>
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
                <p className={styles.none}>
                  Nothing listed yet. Add your first item, then share your store’s link on your WhatsApp
                  status.
                </p>
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
