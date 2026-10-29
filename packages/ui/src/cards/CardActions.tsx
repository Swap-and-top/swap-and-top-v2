'use client';

/**
 * CardActions — save and share, bottom-right on a feed card.
 *
 * These are real buttons, so they cannot live inside the card's link (a
 * `<button>` inside an `<a>` is invalid HTML and the anchor swallows the
 * click). The cards use a stretched link instead, and these sit above it.
 */

import { getListing, useViewerId } from '@snt/core';
import { ReportIcon, SaveStarIcon, ShareIcon } from '../icons';
import { useWishlist } from './useWishlist';
import styles from './CardActions.module.css';

export function CardActions({
  listingId,
  href,
  title,
  tone = 'owned',
  onReport,
  save = true,
}: {
  listingId: string;
  /** The listing's path, shared as a full URL. */
  href: string;
  /** Shared alongside the link. */
  title: string;
  /**
   * The card's colour, which the icons take when hovered: blue on a sale or
   * a swap, green on a Wanted post.
   */
  tone?: 'owned' | 'wanted';
  /**
   * Adds a report button after share, which calls this. For an opened
   * listing, where there is something to read and so something to object
   * to; not on feed cards.
   */
  onReport?: () => void;
  /** The save star. Never on your own listing, wherever it is shown:
      there is nothing to watch for, and it is under My listings already. */
  save?: boolean;
}) {
  const { saved, toggleSaved } = useWishlist(listingId);
  const viewer = useViewerId();
  const mine = viewer !== undefined && getListing(listingId)?.ownerId === viewer;
  const showSave = save && !mine;

  /**
   * The phone's own share sheet where there is one — WhatsApp is where these
   * links go — and a copied link otherwise.
   */
  async function share() {
    const url = new URL(href, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Dismissing the share sheet rejects; there is nothing to do.
    }
  }

  return (
    <span
      className={[
        styles.actions,
        tone === 'wanted' ? styles.wanted : styles.owned,
      ].join(' ')}
    >
      {showSave ? (
        <button
          type="button"
          className={[styles.button, saved ? styles.saved : '']
            .filter(Boolean)
            .join(' ')}
          aria-label={saved ? 'Remove from saved' : 'Save'}
          aria-pressed={saved}
          onClick={toggleSaved}
        >
          <SaveStarIcon size={18} filled={saved} />
        </button>
      ) : null}
      <button
        type="button"
        className={styles.button}
        aria-label="Share listing"
        onClick={share}
      >
        <ShareIcon size={18} />
      </button>
      {onReport ? (
        <button
          type="button"
          className={styles.button}
          aria-label="Report listing"
          onClick={onReport}
        >
          <ReportIcon size={18} weight={1.9} />
        </button>
      ) : null}
    </span>
  );
}
