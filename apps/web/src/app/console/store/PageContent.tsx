'use client';

/**
 * Console — Store profile.
 *
 * The store as buyers find it, kept inside the console: the sidebar stays, so
 * the store can look and move straight on to Stock or Leads. Only what is
 * live shows, as on the public page (read from GET /api/stores/{slug}). The
 * public page itself, under the marketplace's header, is one button away.
 *
 * Under it, the store's owner and staff (StaffPanel): the owner adds and
 * removes staff here.
 */

import { useEffect, useState } from 'react';
import { currentStore, newLeadCount, type Listing, type Store } from '@snt/core';
import { ButtonLink, ConsoleShell, useConsoleTarget } from '@snt/ui';
import { StorefrontBody } from '@/components/Storefront';
import { LeadAlertsChip } from '@/components/leadAlerts/LeadAlerts';
import { useConsoleRole } from '@/lib/consoleRole';
import { useConsoleStock } from '../stock/useConsoleStock';
import { StaffPanel } from './StaffPanel';
import styles from './page.module.css';

export default function ConsoleStorePage() {
  const target = useConsoleTarget() ?? currentStore;
  const stock = useConsoleStock(target.id);
  /** Changing the store's details is the owner's. */
  const owner = useConsoleRole() === 'owner';
  /** The store as its public page has it: details, and live listings. */
  const [page, setPage] = useState<{ store: Store; listings: Listing[] } | null>(null);

  useEffect(() => {
    let gone = false;
    void fetch(`/api/stores/${encodeURIComponent(target.slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: (Store & { listings: Listing[] }) | null) => {
        if (gone || !body) return;
        const { listings, ...store } = body;
        setPage({ store, listings });
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [target.slug]);

  return (
    <ConsoleShell
      store={target}
      title="Store profile"
      meta="Your store as buyers find it, and who runs it"
      newLeadCount={newLeadCount}
      stockCount={stock?.length ?? 0}
      actions={
        <div className={styles.toolbar}>
          {/* Lead alerts are a store setting, so they can be found here too. */}
          <LeadAlertsChip />
          <ButtonLink href={`/store/${target.slug}`} variant="secondary" size="sm">
            View as a buyer
          </ButtonLink>
          {owner ? (
            <ButtonLink href={`/store/${target.slug}/edit`} variant="secondary" size="sm">
              Edit store details
            </ButtonLink>
          ) : null}
        </div>
      }
    >
      <div className={styles.store}>
        {page ? <StorefrontBody store={page.store} listings={page.listings} /> : null}
        <StaffPanel storeId={target.id} />
      </div>
    </ConsoleShell>
  );
}
