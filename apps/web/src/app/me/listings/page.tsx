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
  BottomNav,
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

type View = 'all' | 'offering' | 'wanted';

/** Wanted: what you are looking for. Offering: what you sell or swap. */
const isWanted = (listing: Listing) => listing.type === 'request';

export default function MyListingsPage() {
  const [view, setView] = useState<View>('all');
  const changes = useListingStatusStore((state) => state.changes);

  // Deleted ones are gone for good, and staff removals are not listed here.
  const mine = mockListings.filter((listing) => {
    if (listing.ownerId !== currentUser.id) return false;
    const status = statusOf(listing, changes);
    return status !== 'withdrawn' && status !== 'removed';
  });
  const offering = mine.filter((listing) => !isWanted(listing));
  const wanted = mine.filter(isWanted);
  const shown =
    view === 'offering' ? offering : view === 'wanted' ? wanted : mine;

  const views: TabItem<View>[] = [
    { value: 'all', label: `All ${mine.length}` },
    { value: 'offering', label: `Offering ${offering.length}` },
    { value: 'wanted', label: `Wanted ${wanted.length}` },
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
        <SignInGate
          title="Your listings"
          body="Sign in to see what you have posted."
          reason="Sign in to see your listings."
        >
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

      <BottomNav />
    </Screen>
  );
}
