'use client';

/**
 * Offers grouped under the listing each is for: the listing in brief (its
 * photo, kind and status, name, terms, where and when, and a way to open
 * it), then its offers hung under it on a thread line, like replies.
 *
 * The same on the profile's Offers page and the dealer console's: only whose
 * side it is read from changes (`viewerId`), the person or the shop.
 */

import {
  getShop,
  getUser,
  offersMadeBy,
  offersOn,
  getListing,
  takesOffers,
  type Offer,
  type OfferableListing,
} from '@snt/core';
import {
  ButtonLink,
  ImagePlaceholder,
  OfferCard,
  listingPhoto,
  swapTerms,
} from '@snt/ui';
import {
  BinocularsIcon,
  ChevronRightIcon,
  SwapIcon,
  TagIcon,
} from '@snt/ui/icons';
import { StatusTag } from '@/components/listing/OwnerTools';
import styles from './OfferGroups.module.css';

/** Offers received on a set of listings, each with its own. Listings with
    none are left out. */
export function receivedGroups(
  offers: Offer[],
  listings: OfferableListing[],
): { listing: OfferableListing; offers: Offer[] }[] {
  return listings
    .map((listing) => ({ listing, offers: offersOn(offers, listing.id) }))
    .filter((entry) => entry.offers.length > 0);
}

/** Offers someone has made, by the listing each went to. */
export function madeGroups(
  offers: Offer[],
  userId: string,
): { listing: OfferableListing; offers: Offer[] }[] {
  const made: { listing: OfferableListing; offers: Offer[] }[] = [];
  for (const offer of offersMadeBy(offers, userId)) {
    const listing = getListing(offer.listingId);
    if (!listing || !takesOffers(listing)) continue;
    const group = made.find((entry) => entry.listing.id === listing.id);
    if (group) group.offers.push(offer);
    else made.push({ listing, offers: [offer] });
  }
  return made;
}

/** The groups, one under another, or a line saying there are none. */
export function OfferGroups({
  groups,
  view,
  viewerId,
  none,
}: {
  groups: { listing: OfferableListing; offers: Offer[] }[];
  /** Offers on the viewer's own listings, or offers they made. */
  view: 'received' | 'made';
  /** Whose side it is read from: the person, or the shop's account. */
  viewerId: string;
  /** What to say when there are none. */
  none: string;
}) {
  if (groups.length === 0) return <p className={styles.none}>{none}</p>;

  return (
    <div className={styles.groups}>
      {groups.map(({ listing, offers }) => (
        <section key={listing.id} className={styles.group}>
          <ListingSummary listing={listing} viewerId={viewerId} />

          <h2 className={styles.offersHead}>
            {view === 'received'
              ? 'Offers on this listing'
              : offers.length === 1
                ? 'Your offer on this listing'
                : 'Your offers on this listing'}
            {view === 'received' || offers.length > 1 ? (
              <span className={styles.count}>{offers.length}</span>
            ) : null}
          </h2>
          <div className={styles.offers}>
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                view={view}
                underListing={view === 'made'}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** What kind of listing it is, in a word, with the feed's icon for it. */
const KIND = {
  sale: { label: 'For sale', icon: <TagIcon size={16} /> },
  swap: { label: 'Swap', icon: <SwapIcon size={16} /> },
  request: { label: 'Wanted', icon: <BinocularsIcon size={16} /> },
} as const;

/**
 * A listing in brief, over the offers on it: its photo, what kind it is and
 * how it stands, its name, its price or terms, where and when (and whose,
 * when it is not the viewer's), and a button to open it.
 */
function ListingSummary({
  listing,
  viewerId,
}: {
  listing: OfferableListing;
  viewerId: string;
}) {
  const kind = KIND[listing.type];
  const photo = listingPhoto(listing);
  const mine = listing.ownerId === viewerId;
  const owner = getUser(listing.ownerId);
  const ownerName =
    getShop(owner?.shopId)?.name ?? owner?.displayName ?? 'Someone';

  return (
    <div className={styles.summary}>
      <div className={styles.summaryMain}>
        {photo ? (
          <ImagePlaceholder
            src={photo}
            height={72}
            width={72}
            small
            className={styles.thumb}
          />
        ) : (
          // A wanted listing has no photo: its slot is the wanted green,
          // with the binoculars.
          <span className={styles.thumbWanted} aria-hidden>
            <BinocularsIcon size={28} />
          </span>
        )}

        <div className={styles.summaryText}>
          <div className={styles.kindRow}>
            <span
              className={[
                styles.kind,
                listing.type === 'request' ? styles.kindWanted : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.kindIcon}>{kind.icon}</span>
              {kind.label}
            </span>
            <StatusTag listing={listing} />
          </div>
          <p className={styles.name}>{listing.title}</p>
          <p className={styles.terms}>{termsFor(listing, mine)}</p>
          <p className={styles.meta}>
            {mine ? null : <>{ownerName} · </>}
            {listing.location} · {listing.postedLabel}
            {mine ? (
              <>
                {' '}
                · {listing.viewCount}{' '}
                {listing.viewCount === 1 ? 'view' : 'views'}
              </>
            ) : null}
          </p>
        </div>
      </div>

      <ButtonLink
        href={`/listing/${listing.slug}`}
        variant="secondary"
        size="sm"
        className={styles.see}
      >
        View this listing
        <ChevronRightIcon size={16} />
      </ButtonLink>
    </div>
  );
}

/** Its price, budget or swap terms, in one line, worded for whoever reads
    it: the owner, or someone who made an offer on it. */
function termsFor(listing: OfferableListing, mine: boolean): string {
  switch (listing.type) {
    case 'sale':
      return `$${listing.price}${listing.negotiable ? ', negotiable' : ''}${listing.acceptsSwaps ? ' · Swaps welcome' : ''}`;
    case 'request':
      return `${mine ? 'Your budget' : 'Their budget'}, up to $${listing.budget}`;
    default: {
      const { cashNote } = swapTerms(
        listing.cashDirection,
        listing.cashAmount,
        mine,
        listing.cashUpTo,
      );
      return `${mine ? 'Looking for' : 'They want'} ${listing.wants.name} · ${cashNote}`;
    }
  }
}
