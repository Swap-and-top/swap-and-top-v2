'use client';

/**
 * Console — Offers.
 *
 * Everything the shop has going in offers, in one place, as the profile's
 * Offers page has it for a person (see OfferGroups): Received, the offers on
 * its stock, cash or a swap, to accept or decline; and Sent, the offers it
 * made on Wanted listings from Leads, with what became of each. Each group
 * starts with the listing in brief, its offers under it. Accepting shows the
 * other side's contact ways; the deal is finished in person, as every deal
 * is.
 */

import {
  currentShop,
  getShopListings,
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

/** The shop's own account: its offers are made from it, and its stock is
    read as its own. */
const shopUserId =
  mockUsers.find((user) => user.shopId === currentShop.id)?.id ?? '';

export default function ConsoleOffersPage() {
  const offers = useOfferStore((store) => store.offers);
  const tab = useConsoleStore((state) => state.offersTab);
  const setTab = useConsoleStore((state) => state.setOffersTab);

  const stock = getShopListings(currentShop.id).filter(
    (listing): listing is OfferableListing => takesOffers(listing),
  );
  const received = receivedGroups(offers, stock);
  const sent = madeGroups(offers, shopUserId);
  const waiting = received
    .flatMap((group) => group.offers)
    .filter((offer) => offer.state === 'pending').length;

  return (
    <ConsoleShell
      shop={currentShop}
      title="Offers"
      meta={`${waiting} waiting for a reply`}
      newLeadCount={newLeadCount}
      stockCount={getShopListings(currentShop.id).length}
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
            viewerId={shopUserId}
            none="No offers sent yet. Send one from Leads, on any request that matches your stock."
          />
        ) : (
          <OfferGroups
            groups={received}
            view="received"
            viewerId={shopUserId}
            none="No offers yet. Buyers can make an offer on any item marked negotiable or “Swaps accepted”, straight from the listing."
          />
        )}
      </div>
    </ConsoleShell>
  );
}
