'use client';

/**
 * CardActions — save and share, bottom-right on a feed card.
 *
 * These are real buttons, so they cannot live inside the card's link (a
 * `<button>` inside an `<a>` is invalid HTML and the anchor swallows the
 * click). The cards use a stretched link instead, and these sit above it.
 */

import { toast } from 'sonner';
import { ReportIcon, SaveStarIcon, ShareIcon } from '../icons';
import { useWishlist } from './useWishlist';
import styles from './CardActions.module.css';

export function CardActions({
  listingId,
  href,
  title,
  tone = 'owned',
  report = false,
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
   * Adds a report button after share. For an opened listing, where there is
   * something to read and so something to object to; not on feed cards.
   */
  report?: boolean;
}) {
  const { saved, toggleSaved } = useWishlist(listingId);

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
      <button
        type="button"
        className={[styles.button, saved ? styles.saved : '']
          .filter(Boolean)
          .join(' ')}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
        onClick={toggleSaved}
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
      {report ? (
        <button
          type="button"
          className={styles.button}
          aria-label="Report listing"
          // Reports have nowhere to go until there is a server to take
          // them, so this says so rather than pretending one was sent.
          onClick={() => toast('Reporting a listing is not available yet.')}
        >
          <ReportIcon size={18} weight={1.9} />
        </button>
      ) : null}
    </span>
  );
}
