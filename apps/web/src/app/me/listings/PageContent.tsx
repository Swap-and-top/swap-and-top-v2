'use client';

/**
 * My listings: everything the current user has posted, as feed cards.
 *
 * Their own posts are kept out of the feeds, so this is where they find
 * them. Opening one shows it as the owner sees it: "Your listing", how it is
 * doing, and its offers, in place of a buyer's actions.
 */

import { useState } from 'react';
import {
  currentUser,
  mockListings,
  statusOf,
  useListingStatusStore,
  type Listing,
} from '@snt/core';
import {
  AppHeader,
  ButtonLink,
  EmptyState,
  ListingCard,
  Screen,
  ScreenBody,
  SignInGate,
  Tabs,
  type TabItem,
} from '@snt/ui';
import { StatusTag } from '../../../components/listing/OwnerTools';
import styles from './page.module.css';

/** The same split as the feed's types: swaps, things for sale, wanted. */
type View = 'all' | 'swap' | 'sale' | 'wanted';

const viewOf = (listing: Listing): Exclude<View, 'all'> =>
  listing.type === 'swap'
    ? 'swap'
    : listing.type === 'request'
      ? 'wanted'
      : 'sale';

export default function MyListingsPage() {
  const [view, setView] = useState<View>('all');
  const changes = useListingStatusStore((state) => state.changes);

  // Deleted ones are gone for good, and staff removals are not listed here.
  const mine = mockListings.filter((listing) => {
    if (listing.ownerId !== currentUser.id) return false;
    const status = statusOf(listing, changes);
    return status !== 'withdrawn' && status !== 'removed';
  });
  const shown =
    view === 'all' ? mine : mine.filter((listing) => viewOf(listing) === view);
  const countOf = (kind: Exclude<View, 'all'>) =>
    mine.filter((listing) => viewOf(listing) === kind).length;

  const views: TabItem<View>[] = [
    { value: 'all', label: 'All', count: mine.length },
    { value: 'swap', label: 'Swaps', count: countOf('swap') },
    { value: 'sale', label: 'For Sale', short: 'Sale', count: countOf('sale') },
    { value: 'wanted', label: 'Wanted', count: countOf('wanted') },
  ];

  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>My listings</h1>
        <Tabs
          fill
          tabs={views}
          active={view}
          onChange={setView}
          label="Which of your listings"
        />
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          {shown.length > 0 ? (
            <div className={styles.list}>
              {shown.map((listing) =>
                statusOf(listing, changes) === 'live' ? (
                  <ListingCard key={listing.id} listing={listing} />
                ) : (
                  // Paused, sold or expired: said over the card, which is
                  // dimmed a little, as it is not in the feed.
                  <div key={listing.id} className={styles.down}>
                    <StatusTag listing={listing} />
                    <div className={styles.downCard}>
                      <ListingCard listing={listing} />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState
              title="Nothing posted here yet"
              body="What you post shows here, and stays out of your own feed."
              action={<ButtonLink href="/post">Post New Item</ButtonLink>}
            />
          )}
        </SignInGate>
      </ScreenBody>

    </Screen>
  );
}
