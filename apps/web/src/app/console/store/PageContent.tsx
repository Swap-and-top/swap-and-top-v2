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
 * removes staff here. Loaded through TanStack Query.
 */

import { useQuery } from '@tanstack/react-query';
import { currentStore, newLeadCount, type Listing, type Store } from '@snt/core';
import { ButtonLink, ConsoleShell, useConsoleTarget } from '@snt/ui';
import { StorefrontBody, StorefrontBodySkeleton } from '@/components/Storefront';
import { LeadAlertsChip } from '@/components/leadAlerts/LeadAlerts';
import { useConsoleRole } from '@/lib/consoleRole';
import { publicGet } from '@/lib/query';
import { useConsoleStock } from '../stock/useConsoleStock';
import { StaffPanel } from './StaffPanel';
import styles from './page.module.css';

export default function ConsoleStorePage() {
  const target = useConsoleTarget() ?? currentStore;
  const stock = useConsoleStock(target.id);
  /** Changing the store's details is the owner's. */
  const owner = useConsoleRole() === 'owner';
  /** The store as its public page has it: details, and live listings. */
  const { data: page } = useQuery({
    queryKey: ['store', target.slug, 'page'],
    queryFn: () =>
      publicGet<Store & { listings: Listing[] }>(`/stores/${encodeURIComponent(target.slug)}`).then(
        ({ listings, ...store }) => ({ store: store as Store, listings }),
      ),
  });

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
        {page ? (
          <StorefrontBody own store={page.store} listings={page.listings} />
        ) : (
          <StorefrontBodySkeleton own />
        )}
        <StaffPanel storeId={target.id} />
      </div>
    </ConsoleShell>
  );
}
