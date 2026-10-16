'use client';

/**
 * RevealAction — "Show number".
 *
 * Wired to `useRevealStore`, which in the real system is a server action that
 * records an event carrying the listing, a device hash, the viewer's role and
 * the promotion slot at the time. That last field is what lets promotion be
 * sold on evidence rather than on a promise.
 *
 * A guest can use this. There is no sign-up wall on the contact path — it is
 * the hardest rule in the product and the one most likely to be eroded by
 * reasonable-sounding requests. Two things ask a guest to sign in, and both
 * say why:
 *
 *  - the daily limit: a guest sees a few numbers a day, which a casual buyer
 *    never reaches and someone harvesting numbers reaches at once;
 *  - the seller's own choice to show their number to signed-in users only.
 *
 * Once a guest has the number, a quiet line under it offers the reason to
 * join — asked after they have what they came for, not before.
 */

import {
  GUEST_DAILY_REVEALS,
  requireSignIn,
  revealsLeft,
  useRevealStore,
  useSessionStore,
  useSignInPromptStore,
} from '@snt/core';
import { Button } from '@snt/ui';
import { CheckIcon, PhoneIcon } from '@snt/ui/icons';
import styles from './RevealAction.module.css';

export function RevealAction({
  listingId,
  ownerId,
  signedInOnly = false,
  label = 'Show number',
  block = true,
}: {
  listingId: string;
  ownerId: string;
  /** The seller shows their number to signed-in users only. */
  signedInOnly?: boolean;
  label?: string;
  block?: boolean;
}) {
  const { reveal, revealed, usedToday } = useRevealStore();
  const signedIn = useSessionStore((state) => state.signedIn);
  const ask = useSignInPromptStore((state) => state.ask);
  const number = revealed[listingId];

  function show() {
    const now = () => reveal(listingId, ownerId);

    if (signedInOnly) {
      requireSignIn(
        'This seller shows their number to signed-in users only.',
        now,
      );
      return;
    }
    if (!signedIn && revealsLeft(usedToday, false) === 0) {
      requireSignIn(
        `You have seen ${GUEST_DAILY_REVEALS} numbers today, which is the limit without an account. It is there to stop sellers’ numbers being collected in bulk. Sign in to see more.`,
        now,
      );
      return;
    }
    now();
  }

  if (number) {
    return (
      <div className={styles.revealedWrap}>
        <div className={styles.revealed}>
          <CheckIcon size={18} weight={2.6} />
          <span className={styles.body}>
            <span className={styles.label}>Contact</span>
            <span className={styles.number}>{number}</span>
          </span>
        </div>
        {/* After, not before: they have the number; now the reason to join. */}
        {signedIn ? null : (
          <button
            type="button"
            className={styles.nudge}
            onClick={() =>
              ask({
                reason:
                  'Sign in to save this seller and be told if the price drops.',
              })
            }
          >
            Save this seller and hear if the price drops — sign in
          </button>
        )}
      </div>
    );
  }

  return (
    <Button size="lg" block={block} onClick={show}>
      <PhoneIcon size={18} />
      {label}
    </Button>
  );
}
