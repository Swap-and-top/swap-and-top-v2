'use client';

/**
 * CardActions — save and share, bottom-right on a feed card.
 *
 * These are real buttons, so they cannot live inside the card's link (a
 * `<button>` inside an `<a>` is invalid HTML and the anchor swallows the
 * click). The cards use a stretched link instead, and these sit above it.
 */

import { useSavedStore } from '@snt/core';
import { SaveStarIcon, ShareIcon } from '../icons';
import styles from './CardActions.module.css';

export function CardActions({
  listingId,
  href,
  title,
}: {
  listingId: string;
  /** The listing's path, shared as a full URL. */
  href: string;
  /** Shared alongside the link. */
  title: string;
}) {
  const { ids, toggle } = useSavedStore();
  const saved = ids.includes(listingId);

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
    <span className={styles.actions}>
      <button
        type="button"
        className={[styles.button, saved ? styles.saved : '']
          .filter(Boolean)
          .join(' ')}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
        onClick={() => toggle(listingId)}
      >
        <SaveStarIcon size={18} filled={saved} />
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Share listing"
        onClick={share}
      >
        <ShareIcon size={18} />
      </button>
    </span>
  );
}
