'use client';

/**
 * Offers — everything the current user has going, in one place.
 *
 * Two tabs: offers received on their own listings, grouped by listing so each
 * set can be compared side by side; and offers they have made, grouped by
 * the listing they went to, with what became of each. Each group starts with
 * the listing in brief (what it is, its price or terms, where and when, and
 * a way to open it), its offers under it (see OfferGroups, shared with the
 * Store console's Offers page). An accepted offer on either side shows the
 * other person's number and a way into WhatsApp.
 */

import { useState } from 'react';
import {
  currentUser,
  useLiveListings,
  useOfferStore,
  takesOffers,
  type OfferableListing,
} from '@snt/core';
import {
  AppHeader,
  Screen,
  ScreenBody,
  SignInGate,
  Tabs,
  type TabItem,
} from '@snt/ui';
import {
  OfferGroups,
  madeGroups,
  receivedGroups,
} from '@/components/offers/OfferGroups';
import styles from './page.module.css';

type View = 'received' | 'made';

const VIEWS: TabItem<View>[] = [
  { value: 'received', label: 'Received' },
  { value: 'made', label: 'Made' },
];

export default function OffersPage() {
  const [view, setView] = useState<View>('received');
  const offers = useOfferStore((store) => store.offers);

  /** The user's own listings that take offers, with what came in on
      each; and the offers they made, by the listing each went to. */
  const live = useLiveListings();
  const mine = live.filter(
    (listing): listing is OfferableListing =>
      listing.ownerId === currentUser.id && takesOffers(listing),
  );
  const received = receivedGroups(offers, mine);
  const made = madeGroups(offers, currentUser.id);

  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>Offers</h1>
        <Tabs
          fill
          tabs={VIEWS}
          active={view}
          onChange={setView}
          label="Offers received or made"
        />
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          {view === 'made' ? (
            <OfferGroups
              groups={made}
              view="made"
              viewerId={currentUser.id}
              none="You have not made any offers. Find something you have under Wanted or Swaps, and tap “Make an offer”."
            />
          ) : (
            <OfferGroups
              groups={received}
              view="received"
              viewerId={currentUser.id}
              none="No offers on your listings yet. They will appear here, side by side, as they come in."
            />
          )}
        </SignInGate>
      </ScreenBody>

    </Screen>
  );
}
