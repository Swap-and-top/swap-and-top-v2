'use client';

/**
 * Console — Offers.
 *
 * Everything the store has going in offers, in one place, as the profile's
 * Offers page has it for a person (see OfferGroups): Received, the offers on
 * its stock, cash or a swap, to accept or decline; and Sent, the offers it
 * made on Wanted listings from Leads, with what became of each. Each group
 * starts with the listing in brief, its offers under it. Accepting shows the
 * other side's contact ways; the deal is finished in person, as every deal
 * is.
 *
 * From the API (GET /api/stores/{id}/offers), for the store the console is
 * open for. The offers join the app's offer store, so accepting, declining
 * and withdrawing work as they do on the profile's page, saved through the
 * API.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  currentStore,
  getListing,
  newLeadCount,
  rememberListings,
  takesOffers,
  useConsoleStore,
  useOfferStore,
  viewerId,
  type ConsoleOffersTab,
  type Listing,
  type Offer,
  type OfferableListing,
} from '@snt/core';
import { ConsoleShell, Tabs, useConsoleTarget, type TabItem } from '@snt/ui';
import { OfferGroups, receivedGroups } from '@/components/offers/OfferGroups';
import { apiAsViewer } from '@/lib/supabase';
import styles from './page.module.css';

const TABS: TabItem<ConsoleOffersTab>[] = [
  { value: 'received', label: 'Received' },
  { value: 'sent', label: 'Sent' },
];

/** Offers sent as the store, by the listing each went to. */
function sentGroups(offers: Offer[], storeId: string) {
  const groups: { listing: OfferableListing; offers: Offer[] }[] = [];
  for (const offer of offers) {
    if (offer.fromStoreId !== storeId) continue;
    const listing = getListing(offer.listingId);
    if (!listing || !takesOffers(listing)) continue;
    const group = groups.find((entry) => entry.listing.id === listing.id);
    if (group) group.offers.push(offer);
    else groups.push({ listing, offers: [offer] });
  }
  return groups;
}

export default function ConsoleOffersPage() {
  const store = useConsoleTarget() ?? currentStore;
  const offers = useOfferStore((state) => state.offers);
  const tab = useConsoleStore((state) => state.offersTab);
  const setTab = useConsoleStore((state) => state.setOffersTab);
  /** The store's own listings among those its offers are on. */
  const [stock, setStock] = useState<OfferableListing[] | null>(null);

  useEffect(() => {
    let gone = false;
    void apiAsViewer<{ offers: Offer[]; listings: Listing[] }>(
      `/stores/${encodeURIComponent(store.id)}/offers`,
      { method: 'GET' },
    ).then(({ data, error }) => {
      if (gone) return;
      if (error || !data) {
        toast.error(error ?? 'We could not load the offers.');
        setStock([]);
        return;
      }
      // Found by id wherever an offer card looks its listing up.
      rememberListings(data.listings);
      // Joined with the person's own, each offer once.
      useOfferStore.setState((state) => ({
        offers: [
          ...data.offers,
          ...state.offers.filter((offer) => !data.offers.some((o) => o.id === offer.id)),
        ],
      }));
      setStock(
        data.listings.filter(
          (listing): listing is OfferableListing =>
            listing.storeId === store.id && takesOffers(listing),
        ),
      );
    });
    return () => {
      gone = true;
    };
  }, [store.id]);

  const received = receivedGroups(offers, stock ?? []);
  const sent = sentGroups(offers, store.id);
  const waiting = received
    .flatMap((group) => group.offers)
    .filter((offer) => offer.state === 'pending').length;
  const me = viewerId() ?? '';

  return (
    <ConsoleShell
      store={store}
      title="Offers"
      meta={stock === null ? ' ' : `${waiting} waiting for a reply`}
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.tabs}>
          <Tabs
            fill
            tabs={TABS}
            active={tab}
            onChange={setTab}
            label="Offers received or sent"
          />
        </div>
      }
    >
      <div className={styles.column}>
        {stock === null ? null : tab === 'sent' ? (
          <OfferGroups
            groups={sent}
            view="made"
            viewerId={me}
            none="No offers sent yet. Send one from Leads, on any request that matches your stock."
          />
        ) : (
          <OfferGroups
            groups={received}
            view="received"
            viewerId={me}
            none="No offers yet. Buyers can make an offer on any item marked negotiable or “Swaps accepted”, straight from the listing."
          />
        )}
      </div>
    </ConsoleShell>
  );
}
