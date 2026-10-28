'use client';

/**
 * The listing limit, said plainly where posting stops: a person at 5 live
 * listings for sale or swap, a free store at 15 (docs/product/
 * accounts-and-stores.md). It offers the way on: for a person, opening a
 * store; for a store's owner, a store pass; for both, My listings, to mark
 * one as sold.
 */

import { useState } from 'react';
import { useSessionStore } from '@snt/core';
import { Button, ButtonLink, Sheet, Stack } from '@snt/ui';
import { StorePassSheet } from './StorePassSheet';
import styles from './VerifyPhone.module.css';

export function LimitSheet({
  message,
  storeId,
  onClose,
}: {
  /** The API's own words, with the count. */
  message: string;
  /** Hit as a store: its id. Its owner is offered a pass, not Open a
      store. */
  storeId: string | null;
  onClose: () => void;
}) {
  const store = useSessionStore((state) =>
    state.viewer?.stores.find((s) => s.id === storeId),
  );
  const [buying, setBuying] = useState(false);
  if (buying && store) {
    return <StorePassSheet store={store} onClose={onClose} />;
  }
  return (
    <Sheet narrow title="Listing limit reached" onClose={onClose}>
      <Stack gap={4}>
        <p className={styles.reason}>{message}</p>
        {storeId === null ? (
          <ButtonLink href="/store/new" size="lg" block>
            Open a store
          </ButtonLink>
        ) : store?.role === 'owner' ? (
          <Button size="lg" block onClick={() => setBuying(true)}>
            Get a store pass
          </Button>
        ) : null}
        <ButtonLink href="/me/listings" variant="secondary" size="lg" block>
          My listings
        </ButtonLink>
      </Stack>
    </Sheet>
  );
}
