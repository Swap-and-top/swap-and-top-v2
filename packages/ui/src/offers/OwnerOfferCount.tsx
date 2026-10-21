'use client';

/**
 * On your own listing's card: how many offers it has had, as "Offers on
 * this listing" and the number in a round, worded and set as the heading
 * over the offers when the listing is opened.
 * Nothing for anyone else, or for a listing that does not take offers.
 */

import type { ReactNode } from 'react';
import {
  offersOn,
  takesOffers,
  useOfferStore,
  useViewerId,
  type Listing,
} from '@snt/core';
import styles from './Offers.module.css';

/** Whether the count shows on this card: your own, taking offers. */
function useShowsCount(listing: Listing): boolean {
  const viewer = useViewerId();
  return Boolean(viewer) && listing.ownerId === viewer && takesOffers(listing);
}

/**
 * The count, as the card's last line, with whatever is passed (the save and
 * share icons) at its right, in the card's bottom corner.
 */
export function OwnerOfferCount({
  listing,
  className,
  children,
}: {
  listing: Listing;
  className?: string;
  children?: ReactNode;
}) {
  const offers = useOfferStore((store) => store.offers);
  if (!useShowsCount(listing)) return null;
  const count = offersOn(offers, listing.id).length;
  return (
    <div className={[styles.ownerRow, className ?? ''].filter(Boolean).join(' ')}>
      <span className={styles.ownerCount}>
        Offers on this listing
        <span className={styles.count}>{count}</span>
      </span>
      {children}
    </div>
  );
}

/** What the card shows where the count does not: the icons in their usual
    place, left out when they have moved down beside the count. */
export function UnlessOwnerOfferCount({
  listing,
  children,
}: {
  listing: Listing;
  children: ReactNode;
}) {
  return useShowsCount(listing) ? null : <>{children}</>;
}
