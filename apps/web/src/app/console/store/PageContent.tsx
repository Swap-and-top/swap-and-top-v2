'use client';

/**
 * Console — Store profile.
 *
 * The store as buyers find it, kept inside the console: the sidebar stays, so
 * the store can look and move straight on to Stock or Leads. Only what is
 * live shows, as on the public page, with the store's own edits. The public
 * page itself, under the marketplace's header, is one button away.
 */

import { currentStore, newLeadCount, useStoreStock } from '@snt/core';
import { ButtonLink, ConsoleShell } from '@snt/ui';
import { StorefrontBody } from '@/components/Storefront';
import { LeadAlertsChip } from '@/components/leadAlerts/LeadAlerts';
import styles from './page.module.css';

export default function ConsoleStorePage() {
  const stock = useStoreStock(currentStore.id);
  const live = stock.filter((listing) => listing.status === 'live');

  return (
    <ConsoleShell
      store={currentStore}
      title="Store profile"
      meta="Your store as buyers find it"
      newLeadCount={newLeadCount}
      stockCount={stock.length}
      actions={
        <div className={styles.toolbar}>
          {/* Lead alerts are a store setting, so they can be found here too. */}
          <LeadAlertsChip />
          <ButtonLink
            href={`/store/${currentStore.slug}`}
            variant="secondary"
            size="sm"
          >
            View as a buyer
          </ButtonLink>
        </div>
      }
    >
      <div className={styles.store}>
        <StorefrontBody store={currentStore} listings={live} />
      </div>
    </ConsoleShell>
  );
}
