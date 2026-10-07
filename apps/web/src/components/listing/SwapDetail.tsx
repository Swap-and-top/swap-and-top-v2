'use client';

/**
 * Swap listing detail.
 *
 * Note the primary action: "I have this — make an offer", not "contact seller".
 * A swap is a proposal, so the natural response is a counter-proposal.
 * Revealing the number is secondary.
 *
 * Laid out as the first app did it: each side of the swap is one band — the
 * picture on the left, and beside it, on that side's colour, everything about
 * the item. What they have in blue, on top; what they are looking for in
 * green, under it. Nothing about either item is repeated further down; only
 * what belongs to the listing as a whole follows.
 *
 * Defects are shown with the rest rather than buried — a trade-in's flaws
 * are exactly what a counterparty needs, and hiding them produces failed
 * meetings and reports.
 *
 * Wireframe artboard: `DetailSwap`.
 */

import {
  getUser,
  offerCountFor,
  useOfferStore,
  type Item,
  type SwapListing,
} from '@snt/core';
import {
  AppHeader,
  Button,
  Caption,
  CardActions,
  OfferButton,
  OffersReceived,
  Panel,
  PhotoGallery,
  PosterRow,
  Screen,
  ScreenBody,
  ScreenFooter,
  specRowsFor,
  swapTerms,
} from '@snt/ui';
import { CategoryIcon, PhoneIcon } from '@snt/ui/icons';
import { useRevealStore } from '@snt/core';
import styles from './SwapDetail.module.css';

export function SwapDetail({ listing }: { listing: SwapListing }) {
  const owner = getUser(listing.ownerId);
  const { reveal, revealed } = useRevealStore();
  const number = revealed[listing.id];
  const offers = useOfferStore((store) => store.offers);
  const offerCount = offerCountFor(offers, listing.id, listing.offerCount);

  /** Who pays — worded as on the cards. */
  const terms = swapTerms(listing.cashDirection, listing.cashAmount);

  return (
    <Screen surface>
      {/* The same header as the feed, so the site does not change face on
          the way into a listing. Save and share are in the page. */}
      <AppHeader />

      {/* The swap — the reason this screen exists: what they have, then what
          they are looking for, each with its details beside its picture. */}
      <div className={styles.panel}>
        {/* One white card round both sides and the save and share icons, so
            the swap reads as a single post. */}
        <Panel xl className={styles.card}>
          <SwapSideBand
            tone="has"
            label="Has"
            item={listing.has}
            cash={terms.cashSide === 'has' ? listing.cashAmount : undefined}
          />
          <SwapSideBand
            tone="wants"
            label="Looking for"
            item={listing.wants}
            cash={terms.cashSide === 'wants' ? listing.cashAmount : undefined}
          />

          {/* The post's own facts, under both bands: who adds cash, then
              where it is and how it is doing — with save, share and report
              opposite the first line. */}
          <div className={styles.summary}>
            {/* In the colour of the side the cash comes with: blue when they
                add it to what they have, green when you add it to what they
                are looking for. A straight swap stays plain. */}
            <div
              className={[
                styles.terms,
                terms.cashSide === 'has' ? styles.termsHas : '',
                terms.cashSide === 'wants' ? styles.termsWants : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {terms.cashNote}
            </div>
            <CardActions
              listingId={listing.id}
              href={`/listing/${listing.slug}`}
              title={listing.title}
              report
            />
            <ul className={styles.meta}>
              <li>{listing.location}</li>
              <li>{listing.postedLabel}</li>
              <li>
                {listing.viewCount}{' '}
                {listing.viewCount === 1 ? 'view' : 'views'} today
              </li>
              <li>
                {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
              </li>
            </ul>
          </div>
        </Panel>
      </div>

      <ScreenBody>
        <div className={styles.identity}>
          {owner ? <PosterRow user={owner} /> : null}
        </div>

        {/* Only the owner sees these: the offers made on this swap. */}
        <div className={styles.offers}>
          <OffersReceived listing={listing} />
        </div>
      </ScreenBody>

      <ScreenFooter
        caption={
          <Caption>
            Meet in public · check the device is not locked before swapping
          </Caption>
        }
      >
        {/* A swap is a proposal, so the reply is a counter-proposal: this
            opens the offer sheet. On your own swap it leads to its offers. */}
        <OfferButton
          listing={listing}
          label="I have this — make an offer"
          size="lg"
          block
        />
        <Button
          variant="secondary"
          size="lg"
          iconOnly
          aria-label={number ? `Number shown: ${number}` : 'Show number'}
          onClick={() => reveal(listing.id, listing.ownerId)}
        >
          <PhoneIcon size={20} />
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

/**
 * One side of the swap: its picture, and beside it everything known about the
 * item, on that side's colour. What they have is photographed; what they want
 * is described, never pictured, so its picture is the category's icon.
 */
function SwapSideBand({
  tone,
  label,
  item,
  cash,
}: {
  tone: 'has' | 'wants';
  label: string;
  item: Item;
  /** Cash that comes with this side, if any. */
  cash?: number;
}) {
  const facts = specRowsFor(item);
  // Short facts sit two to a row, then the prose ones a row each. An odd
  // number of short ones leaves the last without a neighbour, so an empty
  // cell fills the gap: the grid stays a grid, and its rules run right across.
  const short = facts.filter((fact) => !fact.wide);
  const prose = facts.filter((fact) => fact.wide);

  return (
    <section className={styles.side}>
      {/* The side's name sits over its band, in the band's colour. */}
      <h2
        className={[
          styles.sideLabel,
          tone === 'has' ? styles.sideLabelHas : styles.sideLabelWants,
        ].join(' ')}
      >
        {label}
      </h2>
      <div className={[styles.band, styles[tone]].join(' ')}>
        <div className={styles.media}>
          {tone === 'has' ? (
            <PhotoGallery
              images={item.images}
              alt={item.name}
              tone="person"
              className={styles.photo}
            />
          ) : (
            <div className={styles.wantedSlot}>
              <CategoryIcon category={item.category} size={56} weight={1.4} />
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.heading}>
            <div className={styles.nameRow}>
              <h3 className={styles.name}>{item.name}</h3>
              {cash ? <span className={styles.cash}>+${cash}</span> : null}
            </div>
          </div>

          {/* The details, set as on a sale listing: a grid of cells, each a
              small label over its value, ruled apart. */}
          {facts.length > 0 ? (
            <dl className={styles.facts}>
              {short.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
            {short.length % 2 === 1 ? (
              <div className={styles.fact} aria-hidden />
            ) : null}
            {prose.map((fact) => (
              <div
                key={fact.label}
                className={[styles.fact, styles.factWide].join(' ')}
              >
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}
