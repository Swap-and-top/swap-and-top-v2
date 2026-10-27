'use client';

/**
 * Stock's Boosted tab: the store's boosted listings, each with how its boost
 * is doing (until when, at what a day, reveals since) and a menu to extend
 * or stop it; above them the yellow "Boost a listing"; under them, the
 * store's live items buyers ask about most, as "Worth boosting", each one tap
 * from its boost.
 */

import Link from 'next/link';
import { toast } from 'sonner';
import {
  currentStore,
  useStoreSponsorships,
  useSponsorStore,
  type Listing,
} from '@snt/core';
import {
  ActionMenu,
  ImagePlaceholder,
  listingPhoto,
  type MenuAction,
} from '@snt/ui';
import { CloseIcon, EyeIcon, MegaphoneIcon } from '@snt/ui/icons';
import styles from './BoostedTab.module.css';

/** How many items "Worth boosting" suggests. */
const SUGGESTIONS = 3;

export function BoostedTab({
  stock,
  onBoost,
}: {
  /** Everything the store holds. */
  stock: Listing[];
  /** Opens the boost sheet: on one item, or to pick one. */
  onBoost: (listingId?: string) => void;
}) {
  const sponsorships = useStoreSponsorships(currentStore.id);
  const stop = useSponsorStore((state) => state.stop);
  const restore = useSponsorStore((state) => state.restore);

  const boosted = sponsorships.flatMap((s) => {
    const listing = stock.find((l) => l.id === s.listingId);
    return listing ? [{ s, listing }] : [];
  });
  // Live items for sale, not boosted, the most asked about first.
  const worth = stock
    .filter(
      (l) =>
        l.status === 'live' &&
        l.type === 'sale' &&
        !sponsorships.some((s) => s.listingId === l.id),
    )
    .sort((a, b) => b.revealCount - a.revealCount)
    .slice(0, SUGGESTIONS);

  function actionsFor(
    listing: Listing,
    s: (typeof sponsorships)[number],
  ): MenuAction[] {
    return [
      {
        label: 'Extend boost',
        icon: <MegaphoneIcon size={17} weight={1.9} />,
        onSelect: () => onBoost(listing.id),
      },
      {
        label: 'View as a buyer',
        icon: <EyeIcon size={17} />,
        href: `/listing/${listing.slug}/preview`,
      },
      {
        label: 'Stop boost',
        icon: <CloseIcon size={16} />,
        onSelect: () => {
          stop(listing.id);
          toast.success(`${listing.title} is no longer boosted.`, {
            action: { label: 'Undo', onClick: () => restore(s) },
            duration: 4500,
          });
        },
      },
    ];
  }

  return (
    <div className={styles.tab}>
      {/* What boosting does, and the way to start one. */}
      <div className={styles.intro}>
        <p className={styles.introText}>
          A boosted listing shows in a labelled Sponsored slot in the feed,
          from $1 a day. The more a day, the more people see it.
        </p>
        <button
          type="button"
          className={styles.boostButton}
          onClick={() => onBoost()}
        >
          <MegaphoneIcon size={17} weight={1.9} />
          Boost a listing
        </button>
      </div>

      {boosted.length > 0 ? (
        <ul className={styles.list}>
          {boosted.map(({ s, listing }) => (
            <li key={listing.id} className={styles.row}>
              {/* The whole row opens the item, as in Stock. */}
              <Link
                href={`/console/stock/edit/${listing.id}`}
                className={styles.rowLink}
                aria-label={`Edit ${listing.title}`}
              />
              <ImagePlaceholder
                src={listingPhoto(listing)}
                height={44}
                width={44}
                small
              />
              <span className={styles.rowText}>
                <span className={styles.name}>{listing.title}</span>
                <span className={styles.line}>
                  Until {s.endsLabel} · ${s.dailyBudget} a day ·{' '}
                  {s.revealsSince}{' '}
                  {s.revealsSince === 1 ? 'reveal' : 'reveals'} since
                </span>
              </span>
              <span className={styles.menu}>
                <ActionMenu
                  label={`More for ${listing.title}`}
                  actions={actionsFor(listing, s)}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.none}>Nothing is boosted right now.</p>
      )}

      {/* The items buyers ask about most, one tap from a boost. */}
      {worth.length > 0 ? (
        <section className={styles.worth}>
          <h2 className={styles.worthTitle}>Worth boosting</h2>
          <p className={styles.worthNote}>
            Your items buyers ask about most. A boost puts them in front of
            more of them.
          </p>
          <ul className={styles.list}>
            {worth.map((listing) => (
              <li key={listing.id} className={styles.row}>
                <ImagePlaceholder
                  src={listingPhoto(listing)}
                  height={44}
                  width={44}
                  small
                />
                <span className={styles.rowText}>
                  <span className={styles.name}>{listing.title}</span>
                  <span className={styles.line}>
                    {listing.revealCount}{' '}
                    {listing.revealCount === 1 ? 'reveal' : 'reveals'} ·{' '}
                    {listing.viewCount}{' '}
                    {listing.viewCount === 1 ? 'view' : 'views'}
                  </span>
                </span>
                <button
                  type="button"
                  className={styles.boostSmall}
                  onClick={() => onBoost(listing.id)}
                >
                  Boost
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
