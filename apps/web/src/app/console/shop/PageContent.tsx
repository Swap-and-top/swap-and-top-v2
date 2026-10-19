'use client';

/**
 * Console — Shop profile.
 *
 * The shop as buyers find it, kept inside the console: the sidebar stays, so
 * the dealer can look and move straight on to Stock or Leads. Only what is
 * live shows, as on the public page, with the dealer's own edits. The public
 * page itself, under the marketplace's header, is one button away.
 */

import { currentShop, newLeadCount, useShopStock } from '@snt/core';
import { ButtonLink, ConsoleShell } from '@snt/ui';
import { ShopfrontBody } from '@/components/Shopfront';
import styles from './page.module.css';

export default function ConsoleShopPage() {
  const stock = useShopStock(currentShop.id);
  const live = stock.filter((listing) => listing.status === 'live');

  return (
    <ConsoleShell
      shop={currentShop}
      title="Shop profile"
      meta="Your shop as buyers find it"
      newLeadCount={newLeadCount}
      stockCount={stock.length}
      actions={
        <div className={styles.toolbar}>
          <ButtonLink
            href={`/shop/${currentShop.slug}`}
            variant="secondary"
            size="sm"
          >
            View as a buyer
          </ButtonLink>
        </div>
      }
    >
      <div className={styles.shop}>
        <ShopfrontBody shop={currentShop} listings={live} />
      </div>
    </ConsoleShell>
  );
}
