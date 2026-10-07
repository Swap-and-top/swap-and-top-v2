'use client';

/**
 * The two lists of offers: those received on one of your listings, and those
 * you have made.
 *
 * Received offers are a list the owner reviews when they choose — the same
 * three facts on every card, so five offers can be weighed side by side —
 * not a stream of messages. That is the point of an offer over a phone call.
 */

import {
  CURRENT_USER_ID,
  offersMadeBy,
  offersOn,
  useOfferStore,
  type DemandListing,
} from '@snt/core';
import { Eyebrow } from '../primitives/Text';
import { OfferCard } from './OfferCard';
import styles from './Offers.module.css';

/** Offers on one listing, for its owner. Renders nothing for anyone else. */
export function OffersReceived({ listing }: { listing: DemandListing }) {
  const offers = useOfferStore((store) => store.offers);
  if (listing.ownerId !== CURRENT_USER_ID) return null;

  const received = offersOn(offers, listing.id);

  return (
    <section id="offers" className={styles.list}>
      <Eyebrow>
        Offers on your listing
        <span className={styles.count}>{received.length}</span>
      </Eyebrow>
      {received.length > 0 ? (
        received.map((offer) => (
          <OfferCard key={offer.id} offer={offer} view="received" />
        ))
      ) : (
        <p className={styles.none}>
          No offers yet. They will appear here, side by side, as they come in.
        </p>
      )}
    </section>
  );
}

/** Every offer the current user has made, newest first. */
export function OffersMade() {
  const offers = useOfferStore((store) => store.offers);
  const made = offersMadeBy(offers, CURRENT_USER_ID);

  if (made.length === 0) {
    return (
      <p className={styles.none}>
        You have not made any offers. Find something you have under Wanted or
        Swaps, and tap “I have this”.
      </p>
    );
  }

  return (
    <div className={styles.list}>
      {made.map((offer) => (
        <OfferCard key={offer.id} offer={offer} view="made" />
      ))}
    </div>
  );
}
