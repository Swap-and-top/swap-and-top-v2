'use client';

/**
 * Console — Edit or Finish an item: the stock form, filled in with it. A
 * draft opens as "Finish draft"; anything else as "Edit item".
 */

import { useParams } from 'next/navigation';
import { currentStore, newLeadCount, useStoreStock } from '@snt/core';
import { ButtonLink, ConsoleShell } from '@snt/ui';
import { StockForm } from '../../StockForm';
import styles from '../../StockForm.module.css';

export default function EditStockPage() {
  const { id } = useParams<{ id: string }>();
  const stock = useStoreStock(currentStore.id);
  const listing = stock.find((item) => item.id === id);

  if (listing?.type === 'sale') {
    // Keyed, so moving from one item to another starts the form afresh.
    return <StockForm key={listing.id} editing={listing} />;
  }

  return (
    <ConsoleShell
      store={currentStore}
      title="Item not found"
      newLeadCount={newLeadCount}
      stockCount={stock.length}
    >
      <div className={styles.form}>
        <p className={styles.gone}>
          This item is not in your stock any more.
        </p>
        <ButtonLink href="/console/stock" variant="secondary" size="md">
          Back to stock
        </ButtonLink>
      </div>
    </ConsoleShell>
  );
}
