'use client';

/**
 * The few things only the person who posted a listing sees on it.
 *
 * A buyer's "Make an offer" and "Show contacts" make no sense on your own
 * post, and neither does your own name card. In their place, worked into the
 * listing rather than set apart in a card of their own: its status at the
 * top of its details, how it is doing in its line of facts, and a way to
 * change it. Its offers follow, under it.
 */

import { toast } from 'sonner';
import type { Listing } from '@snt/core';
import { Button } from '@snt/ui';
import styles from './OwnerTools.module.css';

const STATUS: Record<Listing['status'], string> = {
  draft: 'Draft',
  live: 'Live',
  sold: 'Sold',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  removed: 'Removed',
};

/** Live, Sold…: a small pill, green with a dot while live. */
export function StatusTag({
  status,
  className,
}: {
  status: Listing['status'];
  className?: string;
}) {
  return (
    <span
      className={[styles.status, status === 'live' ? styles.live : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {STATUS[status]}
    </span>
  );
}

/** How many times a contact on it was shown, for its line of facts. */
export function contactsShown(listing: Listing): string {
  const count = listing.revealCount;
  return `${count} ${count === 1 ? 'contact' : 'contacts'} shown`;
}

export function EditListingButton() {
  return (
    <Button
      variant="secondary"
      size="lg"
      block
      onClick={() => toast('Editing a listing is not available yet.')}
    >
      Edit listing
    </Button>
  );
}
