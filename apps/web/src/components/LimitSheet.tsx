'use client';

/**
 * The listing limit, said plainly where posting stops: a person at 5 live
 * listings for sale or swap, a free store at 15 (docs/product/
 * accounts-and-stores.md). It offers the way on: for a person, opening a
 * store; for both, My listings, to mark one as sold.
 */

import { ButtonLink, Sheet, Stack } from '@snt/ui';
import styles from './VerifyPhone.module.css';

export function LimitSheet({
  message,
  asStore,
  onClose,
}: {
  /** The API's own words, with the count. */
  message: string;
  /** Hit as a store: no "Open a store". */
  asStore: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet narrow title="Listing limit reached" onClose={onClose}>
      <Stack gap={4}>
        <p className={styles.reason}>{message}</p>
        {asStore ? null : (
          <ButtonLink href="/store/new" size="lg" block>
            Open a store
          </ButtonLink>
        )}
        <ButtonLink href="/me/listings" variant="secondary" size="lg" block>
          My listings
        </ButtonLink>
      </Stack>
    </Sheet>
  );
}
