'use client';

/**
 * The "Boost this listing" banner, above an owner's own listing: on a
 * store's item in Stock (its edit page), and on a person's own listing
 * page. In the app's call to action colours, the yellow and green of Post
 * New Item: what sponsoring does, a button that opens the Sponsor sheet,
 * and an X to close it for that listing.
 *
 * Once the listing is sponsored it is a quiet line instead: until when and
 * at what a day, with Extend. Only for a live listing: a sold, paused or
 * draft one cannot be sponsored.
 */

import { useState } from 'react';
import {
  dollars,
  useListingStatus,
  useSponsorStore,
  type Listing,
} from '@snt/core';
import { Button } from '@snt/ui';
import { CloseIcon, MegaphoneIcon } from '@snt/ui/icons';
import { SponsorSheet } from './SponsorSheet';
import styles from './SponsorBanner.module.css';

export function SponsorBanner({
  listing,
  className,
}: {
  listing: Listing;
  className?: string;
}) {
  const status = useListingStatus(listing);
  const sponsorship = useSponsorStore((state) =>
    state.sponsorships.find((s) => s.listingId === listing.id),
  );
  const dismissed = useSponsorStore((state) =>
    state.dismissed.includes(listing.id),
  );
  const dismiss = useSponsorStore((state) => state.dismiss);
  const [open, setOpen] = useState(false);

  if (status !== 'live') return null;
  if (!sponsorship && dismissed) return null;

  const sheet = open ? (
    <SponsorSheet listingId={listing.id} onClose={() => setOpen(false)} />
  ) : null;

  // Sponsored already: until when, at what a day, and Extend.
  if (sponsorship) {
    return (
      <div className={[styles.running, className ?? ''].filter(Boolean).join(' ')}>
        <span className={styles.runningIcon} aria-hidden>
          <MegaphoneIcon size={16} weight={1.9} />
        </span>
        <span className={styles.runningText}>
          Boosted until {sponsorship.endsLabel} ·{' '}
          {dollars(sponsorship.dailyBudget)} a day
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Extend
        </Button>
        {sheet}
      </div>
    );
  }

  return (
    <div className={[styles.banner, className ?? ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={styles.close}
        aria-label="Close"
        onClick={() => dismiss(listing.id)}
      >
        <CloseIcon size={16} weight={2.2} />
      </button>
      <span className={styles.icon} aria-hidden>
        <MegaphoneIcon size={20} weight={1.9} />
      </span>
      <div className={styles.body}>
        <span className={styles.title}>Boost this listing</span>
        <span className={styles.text}>
          Show it to more people, in a labelled Sponsored slot in the feed.
          From $1 a day, paid through Paynow.
        </span>
        <Button
          type="button"
          size="sm"
          className={styles.button}
          onClick={() => setOpen(true)}
        >
          Boost this listing
        </Button>
      </div>
      {sheet}
    </div>
  );
}
