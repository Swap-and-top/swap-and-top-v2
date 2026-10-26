'use client';

/**
 * The few things only the person who posted a listing sees on it.
 *
 * A buyer's "Make an offer" and "Show contacts" make no sense on your own
 * post, and neither does your own name card. In their place, worked into the
 * listing rather than set apart in a card of their own: its status at the
 * top of its details, how it is doing in its line of facts, and what you can
 * do to it. Its offers follow, under it.
 *
 * What you can do follows docs/features/listing-types.md and
 * docs/api/endpoints.md: mark it sold (or swapped, or found), delete it
 * (withdrawn, never a hard delete) and relist it. Pause is ours: a listing
 * taken down for now, which you can bring back.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  contactAfterOffer,
  useListingStatus,
  useListingStatusStore,
  type Listing,
  type ListingStatus,
} from '@snt/core';
import { Button, Sheet, startPageLoad, useCloseSheet } from '@snt/ui';
import { CheckIcon, PauseIcon, TrashIcon } from '@snt/ui/icons';
import styles from './OwnerTools.module.css';

/**
 * How long a message with Undo stays up: two seconds longer than the usual
 * 2.5 (set on the Toaster), so there is time to reach the button.
 */
const UNDO_TOAST_MS = 4500;

/** "Sold" said the way each kind of listing ends. */
const DONE: Record<Listing['type'], { tag: string; action: string; told: string }> = {
  sale: { tag: 'Sold', action: 'Mark as sold', told: 'Marked as sold' },
  swap: { tag: 'Swapped', action: 'Mark as swapped', told: 'Marked as swapped' },
  request: { tag: 'Found', action: 'Mark as found', told: 'Marked as found' },
  auction: { tag: 'Sold', action: 'Mark as sold', told: 'Marked as sold' },
};

function statusLabel(status: ListingStatus, type: Listing['type']): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'paused':
      return 'Paused';
    case 'sold':
      return DONE[type].tag;
    case 'expired':
      return 'Expired';
    case 'draft':
      return 'Draft';
    case 'withdrawn':
      return 'Deleted';
    default:
      return 'Removed';
  }
}

/**
 * Live, Paused, Sold…: a small pill, its colour and mark saying which. Live
 * is green with a dot; paused is red with a pause mark; sold, swapped or
 * found is blue with a tick. Anything else is plain grey.
 */
export function StatusTag({
  listing,
  className,
}: {
  listing: Listing;
  className?: string;
}) {
  const status = useListingStatus(listing);
  const tone =
    status === 'live'
      ? styles.live
      : status === 'paused'
        ? styles.paused
        : status === 'sold'
          ? styles.done
          : '';
  return (
    <span
      className={[styles.status, tone, className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {status === 'paused' ? (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <rect x="1.5" y="1" width="2.4" height="8" rx="0.8" fill="currentColor" />
          <rect x="6.1" y="1" width="2.4" height="8" rx="0.8" fill="currentColor" />
        </svg>
      ) : null}
      {status === 'sold' ? <CheckIcon size={12} weight={3} /> : null}
      {statusLabel(status, listing.type)}
    </span>
  );
}

/** How many times a contact on it was shown, for its line of facts; or,
    where the details wait for an accepted offer, that they do. */
export function contactsShown(listing: Listing): string {
  if (contactAfterOffer(listing)) return 'Contact shared after you accept an offer';
  const count = listing.revealCount;
  return `${count} ${count === 1 ? 'contact' : 'contacts'} shown`;
}

/**
 * What the owner can do: while it is live, edit it or manage it (sold,
 * pause, delete); once it is down, relist it, or delete it for good.
 */
export function OwnerControls({ listing }: { listing: Listing }) {
  const status = useListingStatus(listing);
  const setStatus = useListingStatusStore((state) => state.setStatus);
  const [managing, setManaging] = useState(false);
  /** The sheet has moved on to the check before a delete. */
  const [deleting, setDeleting] = useState(false);
  const live = status === 'live';

  function relist() {
    setStatus(listing.id, 'live');
    toast.success('Live again, back in the feed.');
  }

  return (
    <>
      <div className={styles.controls}>
        {live ? (
          <Button
            variant="secondary"
            size="lg"
            block
            onClick={() => toast('Editing a listing is not available yet.')}
          >
            Edit listing
          </Button>
        ) : (
          <Button size="lg" block onClick={relist}>
            Relist
          </Button>
        )}
        <Button
          variant="secondary"
          size="lg"
          block
          onClick={() => setManaging(true)}
        >
          Manage
        </Button>
      </div>

      {managing ? (
        <Sheet
          narrow
          // Once Delete is chosen the sheet says so, in red, so there is no
          // doubt what the next button does.
          title={deleting ? 'Delete listing' : 'Manage listing'}
          heading={
            deleting ? (
              <span className={styles.deleteTitle}>
                <TrashIcon size={20} />
                Delete listing
              </span>
            ) : undefined
          }
          onClose={() => {
            setManaging(false);
            setDeleting(false);
          }}
        >
          <ManageBody
            listing={listing}
            status={status}
            confirmDelete={deleting}
            setConfirmDelete={setDeleting}
          />
        </Sheet>
      ) : null}
    </>
  );
}

/** The choices in the Manage sheet, and the check before a delete. */
function ManageBody({
  listing,
  status,
  confirmDelete,
  setConfirmDelete,
}: {
  listing: Listing;
  status: ListingStatus;
  confirmDelete: boolean;
  setConfirmDelete: (value: boolean) => void;
}) {
  const router = useRouter();
  const close = useCloseSheet();
  const setStatus = useListingStatusStore((state) => state.setStatus);
  const done = DONE[listing.type];

  /** Changes it, says so, and offers to put it back as it was. */
  function change(next: ListingStatus, told: string) {
    const before = status;
    setStatus(listing.id, next);
    close();
    toast.success(told, {
      action: { label: 'Undo', onClick: () => setStatus(listing.id, before) },
      duration: UNDO_TOAST_MS,
    });
  }

  function remove() {
    setStatus(listing.id, 'withdrawn');
    close();
    toast.success('Listing deleted.');
    startPageLoad();
    router.push('/me/listings');
  }

  if (confirmDelete) {
    return (
      <div className={styles.confirm}>
        <p className={styles.confirmText}>
          Are you sure you want to delete this listing? It comes down for
          everyone, its offers close, and it can’t be brought back. To take
          it down for a while instead, pause it.
        </p>
        <div className={styles.controls}>
          <Button
            variant="secondary"
            size="lg"
            block
            onClick={() => setConfirmDelete(false)}
          >
            Keep it
          </Button>
          <Button size="lg" block className={styles.deleteButton} onClick={remove}>
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {status === 'live' ? (
        <>
          <li>
            <button
              type="button"
              className={styles.row}
              onClick={() =>
                change('sold', `${done.told}. It’s off the feed and search now.`)
              }
            >
              <span className={styles.rowIcon}>
                <CheckIcon size={18} />
              </span>
              <span className={styles.rowLabel}>{done.action}</span>
              <span className={styles.rowNote}>Takes it off the feed</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={styles.row}
              onClick={() =>
                change('paused', 'Paused. It’s hidden until you relist it.')
              }
            >
              <span className={styles.rowIcon}>
                <PauseIcon size={18} />
              </span>
              <span className={styles.rowLabel}>Pause listing</span>
              <span className={styles.rowNote}>Hide it for now</span>
            </button>
          </li>
        </>
      ) : null}
      <li>
        <button
          type="button"
          className={[styles.row, styles.danger].join(' ')}
          onClick={() => setConfirmDelete(true)}
        >
          <span className={styles.rowIcon}>
            <TrashIcon size={18} />
          </span>
          <span className={styles.rowLabel}>Delete listing</span>
          <span className={styles.rowNote}>For good</span>
        </button>
      </li>
    </ul>
  );
}
