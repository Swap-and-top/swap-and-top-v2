'use client';

/**
 * Console — Trade-ins.
 *
 * Trade-ins offered towards the shop's stock: on any item it marked "Swaps
 * accepted", a buyer can offer what they have, with cash on top, straight
 * from the listing. They arrive here, grouped by the item they are for, to
 * accept or decline, as on any offer. Accepting shows the buyer's contact
 * ways; the deal is finished in person, as every deal is.
 */

import Link from 'next/link';
import {
  currentShop,
  getShopListings,
  newLeadCount,
  offersOn,
  useOfferStore,
} from '@snt/core';
import { ConsoleShell, Eyebrow, OfferCard } from '@snt/ui';
import styles from './page.module.css';

export default function ConsoleTradeInsPage() {
  const offers = useOfferStore((store) => store.offers);
  const stock = getShopListings(currentShop.id);

  const withOffers = stock
    .map((listing) => ({ listing, received: offersOn(offers, listing.id) }))
    .filter((entry) => entry.received.length > 0);

  const waiting = withOffers
    .flatMap((entry) => entry.received)
    .filter((offer) => offer.state === 'pending').length;
  const takingSwaps = stock.filter(
    (listing) => listing.type === 'sale' && listing.acceptsSwaps,
  ).length;

  return (
    <ConsoleShell
      shop={currentShop}
      title="Swap offers"
      meta={`${waiting} waiting for a reply · ${takingSwaps} items take swaps`}
      newLeadCount={newLeadCount}
      stockCount={stock.length}
    >
      {withOffers.length > 0 ? (
        <div className={styles.groups}>
          {withOffers.map(({ listing, received }) => (
            <section key={listing.id} className={styles.group}>
              {/* Which item these are for. */}
              <Eyebrow>
                <Link href={`/listing/${listing.slug}`} className={styles.for}>
                  For {listing.title}
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
          No swap offers yet. Mark an item “Swaps accepted” and buyers can
          offer something they have towards it, straight from the listing.
        </p>
      )}
    </ConsoleShell>
  );
}
