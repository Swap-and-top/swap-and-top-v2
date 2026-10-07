'use client';

/**
 * Offers — everything the current user has going, in one place.
 *
 * Two tabs: offers received on their own listings, grouped by listing so each
 * set can be compared side by side; and offers they have made, with what
 * became of each. An accepted offer on either side shows the other person's
 * number and a way into WhatsApp.
 */

import Link from 'next/link';
import { useState } from 'react';
import {
  currentUser,
  liveListings,
  offersOn,
  useOfferStore,
  type DemandListing,
} from '@snt/core';
import {
  AppHeader,
  BottomNav,
  Eyebrow,
  OfferCard,
  OffersMade,
  Screen,
  ScreenBody,
  Tabs,
  type TabItem,
} from '@snt/ui';
import styles from './page.module.css';

type View = 'received' | 'made';

const VIEWS: TabItem<View>[] = [
  { value: 'received', label: 'Received' },
  { value: 'made', label: 'Made' },
];

export default function OffersPage() {
  const [view, setView] = useState<View>('received');
  const offers = useOfferStore((store) => store.offers);

  /** The user's own swaps and requests — the listings offers can land on. */
  const mine = liveListings.filter(
    (listing): listing is DemandListing =>
      listing.ownerId === currentUser.id &&
      (listing.type === 'swap' || listing.type === 'request'),
  );
  const withOffers = mine
    .map((listing) => ({ listing, received: offersOn(offers, listing.id) }))
    .filter((entry) => entry.received.length > 0);

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
        {view === 'made' ? (
          <OffersMade />
        ) : withOffers.length > 0 ? (
          <div className={styles.groups}>
            {withOffers.map(({ listing, received }) => (
              <section key={listing.id} className={styles.group}>
                {/* Which of your listings these are for. */}
                <Eyebrow>
                  <Link href={`/listing/${listing.slug}`} className={styles.for}>
                    {listing.title}
                  </Link>
                </Eyebrow>
                {received.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} view="received" />
                ))}
              </section>
            ))}
          </div>
        ) : (
          <p className={styles.none}>
            No offers on your listings yet. They will appear here, side by
            side, as they come in.
          </p>
        )}
      </ScreenBody>

      <BottomNav />
    </Screen>
  );
}
