'use client';

/**
 * Before a listing is marked sold (or swapped, or found): a short sheet
 * saying that its chats close 48 hours later, so the owner finishes
 * arranging delivery or payment first, and does not mark it too early.
 * Mark as sold goes ahead; Not yet backs out.
 */

import type { Listing } from '@snt/core';
import { Button, Sheet, Stack } from '@snt/ui';
import styles from './ConfirmSold.module.css';

/** The words for each kind of listing. */
const WORDS: Record<Listing['type'], { done: string; action: string; who: string }> = {
  sale: { done: 'sold', action: 'Mark as sold', who: 'the buyer' },
  swap: { done: 'swapped', action: 'Mark as swapped', who: 'the person you are swapping with' },
  request: { done: 'found', action: 'Mark as found', who: 'the seller' },
  auction: { done: 'sold', action: 'Mark as sold', who: 'the buyer' },
};

/** What marking it sold means for its chats, in a sentence. */
export function soldWarning(type: Listing['type']): string {
  const words = WORDS[type];
  return `Chats about this listing close 48 hours after you mark it ${words.done}. If you still need to arrange delivery or payment with ${words.who}, make sure you have what you need before then.`;
}

/** The button that goes ahead: "Mark as sold". */
export function soldAction(type: Listing['type']): string {
  return WORDS[type].action;
}

export function ConfirmSold({
  type,
  onConfirm,
  onClose,
}: {
  type: Listing['type'];
  onConfirm: () => void;
  onClose: () => void;
}) {
  const words = WORDS[type];
  return (
    <Sheet narrow title={`${words.action}?`} onClose={onClose}>
      <Stack gap={6}>
        <p className={styles.note}>{soldWarning(type)}</p>
        <Stack gap={2}>
          <Button
            size="md"
            block
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {words.action}
          </Button>
          <Button variant="secondary" size="md" block onClick={onClose}>
            Not yet
          </Button>
        </Stack>
      </Stack>
    </Sheet>
  );
}
