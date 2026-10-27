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
 */

import {
  currentStore,
  getStoreListings,
  mockUsers,
  newLeadCount,
  takesOffers,
  useConsoleStore,
  useOfferStore,
  type ConsoleOffersTab,
  type OfferableListing,
} from '@snt/core';
import { ConsoleShell, Tabs, type TabItem } from '@snt/ui';
import {
  OfferGroups,
  madeGroups,
  receivedGroups,
} from '@/components/offers/OfferGroups';
import styles from './page.module.css';

const TABS: TabItem<ConsoleOffersTab>[] = [
  { value: 'received', label: 'Received' },
  { value: 'sent', label: 'Sent' },
];

/** The store's own account: its offers are made from it, and its stock is
    read as its own. */
const storeUserId =
  mockUsers.find((user) => user.storeId === currentStore.id)?.id ?? '';

export default function ConsoleOffersPage() {
  const offers = useOfferStore((store) => store.offers);
  const tab = useConsoleStore((state) => state.offersTab);
  const setTab = useConsoleStore((state) => state.setOffersTab);

  const stock = getStoreListings(currentStore.id).filter(
    (listing): listing is OfferableListing => takesOffers(listing),
  );
  const received = receivedGroups(offers, stock);
  const sent = madeGroups(offers, storeUserId);
  const waiting = received
    .flatMap((group) => group.offers)
    .filter((offer) => offer.state === 'pending').length;

  return (
    <ConsoleShell
      store={currentStore}
      title="Offers"
      meta={`${waiting} waiting for a reply`}
      newLeadCount={newLeadCount}
      stockCount={getStoreListings(currentStore.id).length}
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
        {tab === 'sent' ? (
          <OfferGroups
            groups={sent}
            view="made"
            viewerId={storeUserId}
            none="No offers sent yet. Send one from Leads, on any request that matches your stock."
          />
        ) : (
          <OfferGroups
            groups={received}
            view="received"
            viewerId={storeUserId}
            none="No offers yet. Buyers can make an offer on any item marked negotiable or “Swaps accepted”, straight from the listing."
          />
        )}
      </div>
    </ConsoleShell>
  );
}
