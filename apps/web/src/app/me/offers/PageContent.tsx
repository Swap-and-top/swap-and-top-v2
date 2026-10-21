'use client';

/**
 * Offers — everything the current user has going, in one place.
 *
 * Two tabs: offers received on their own listings, grouped by listing so each
 * set can be compared side by side; and offers they have made, grouped by
 * the listing they went to, with what became of each. Each group starts with
 * the listing in brief (what it is, its price or terms, where and when, and
 * a way to open it), its offers under it. An accepted offer on either side shows the other person's
 * number and a way into WhatsApp.
 */

import { useState } from 'react';
import {
  currentUser,
  getListing,
  getShop,
  getUser,
  useLiveListings,
  offersMadeBy,
  offersOn,
  useOfferStore,
  takesOffers,
  type Offer,
  type OfferableListing,
} from '@snt/core';
import {
  AppHeader,
  ButtonLink,
  ImagePlaceholder,
  OfferCard,
  Screen,
  ScreenBody,
  SignInGate,
  Tabs,
  listingPhoto,
  swapTerms,
  type TabItem,
} from '@snt/ui';
import {
  BinocularsIcon,
  ChevronRightIcon,
  SwapIcon,
  TagIcon,
} from '@snt/ui/icons';
import { StatusTag } from '@/components/listing/OwnerTools';
import styles from './page.module.css';

type View = 'received' | 'made';

const VIEWS: TabItem<View>[] = [
  { value: 'received', label: 'Received' },
  { value: 'made', label: 'Made' },
];

export default function OffersPage() {
  const [view, setView] = useState<View>('received');
  const offers = useOfferStore((store) => store.offers);

  /** The user's own listings that take offers: swaps and requests, and
      sales that take trade ins. */
  const live = useLiveListings();
  const mine = live.filter(
    (listing): listing is OfferableListing =>
      listing.ownerId === currentUser.id && takesOffers(listing),
  );
  const withOffers = mine
    .map((listing) => ({ listing, received: offersOn(offers, listing.id) }))
    .filter((entry) => entry.received.length > 0);

  /** The offers the user has made, by the listing each went to, the listing
      with the newest offer first. */
  const made: { listing: OfferableListing; sent: Offer[] }[] = [];
  for (const offer of offersMadeBy(offers, currentUser.id)) {
    const listing = getListing(offer.listingId);
    if (!listing || !takesOffers(listing)) continue;
    const group = made.find((entry) => entry.listing.id === listing.id);
    if (group) group.sent.push(offer);
    else made.push({ listing, sent: [offer] });
  }

  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>Offers</h1>
        <Tabs
          fill
          tabs={VIEWS}
          active={view}
          onChange={setView}
          label="Offers received or made"
        />
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          {view === 'made' ? (
            made.length > 0 ? (
              <div className={styles.groups}>
                {made.map(({ listing, sent }) => (
                  <section key={listing.id} className={styles.group}>
                    {/* The listing your offer went to, in brief. */}
                    <ListingSummary listing={listing} />

                    <h2 className={styles.offersHead}>
                      {sent.length === 1
                        ? 'Your offer on this listing'
                        : 'Your offers on this listing'}
                      {sent.length > 1 ? (
                        <span className={styles.count}>{sent.length}</span>
                      ) : null}
                    </h2>
                    <div className={styles.offers}>
                      {sent.map((offer) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          view="made"
                          underListing
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className={styles.none}>
                You have not made any offers. Find something you have under
                Wanted or Swaps, and tap “I have this”.
              </p>
            )
          ) : withOffers.length > 0 ? (
            <div className={styles.groups}>
              {withOffers.map(({ listing, received }) => (
                <section key={listing.id} className={styles.group}>
                  {/* Which of your listings these are for, in brief. */}
                  <ListingSummary listing={listing} />

                  {/* Its offers, hung under it on a rail. */}
                  <h2 className={styles.offersHead}>
                    Offers on this listing
                    <span className={styles.count}>{received.length}</span>
                  </h2>
                  <div className={styles.offers}>
                    {received.map((offer) => (
                      <OfferCard key={offer.id} offer={offer} view="received" />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className={styles.none}>
              No offers on your listings yet. They will appear here, side by
              side, as they come in.
            </p>
          )}
        </SignInGate>
      </ScreenBody>

    </Screen>
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
 * when it is not yours), and a button to open it.
 */
function ListingSummary({ listing }: { listing: OfferableListing }) {
  const kind = KIND[listing.type];
  const photo = listingPhoto(listing);
  const mine = listing.ownerId === currentUser.id;
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
      return `$${listing.price}${listing.negotiable ? ', negotiable' : ''} · Swaps welcome`;
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
