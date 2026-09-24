'use client';

/**
 * RevealAction — "Show number".
 *
 * Wired to `useRevealStore`, which in the real system is a server action that
 * records an event carrying the listing, a device hash, the viewer's role and
 * the promotion slot at the time. That last field is what lets promotion be
 * sold on evidence rather than on a promise.
 *
 * A guest can use this. There is no sign-up wall on the contact path — it is the
 * hardest rule in the product and the one most likely to be eroded by
 * reasonable-sounding requests.
 */

import { useRevealStore } from '@snt/core';
import { Button } from '@snt/ui';
import { CheckIcon, PhoneIcon } from '@snt/ui/icons';
import styles from './RevealAction.module.css';

export function RevealAction({
  listingId,
  ownerId,
  label = 'Show number',
  block = true,
}: {
  listingId: string;
  ownerId: string;
  label?: string;
  block?: boolean;
}) {
  const { reveal, revealed } = useRevealStore();
  const number = revealed[listingId];

  if (number) {
    return (
      <div className={styles.revealed}>
        <CheckIcon size={18} weight={2.6} />
        <span className={styles.body}>
          <span className={styles.label}>Contact</span>
          <span className={styles.number}>{number}</span>
        </span>
      </div>
    );
  }

  return (
    <Button
      size="lg"
      block={block}
      onClick={() => reveal(listingId, ownerId)}
    >
      <PhoneIcon size={18} />
      {label}
    </Button>
  );
}
