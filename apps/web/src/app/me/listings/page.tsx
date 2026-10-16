'use client';

/**
 * My listings: everything the current user has posted, as feed cards.
 *
 * Their own posts are kept out of the feeds, so this is where they find
 * them. Opening one shows it as the owner sees it: "Your listing", how it is
 * doing, and its offers, in place of a buyer's actions.
 */

import { useState } from 'react';
import { currentUser, mockListings, type Listing } from '@snt/core';
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
import styles from './page.module.css';

type View = 'all' | 'offering' | 'wanted';

/** Wanted: what you are looking for. Offering: what you sell or swap. */
const isWanted = (listing: Listing) => listing.type === 'request';

export default function MyListingsPage() {
  const [view, setView] = useState<View>('all');

  const mine = mockListings.filter(
    (listing) =>
      listing.ownerId === currentUser.id && listing.status !== 'removed',
  );
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
              {shown.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
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
