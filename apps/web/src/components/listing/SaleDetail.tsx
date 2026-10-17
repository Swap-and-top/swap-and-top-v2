'use client';

/**
 * Sale listing detail.
 *
 * One white card, joined to its photo as a swap's side is: the photo on top,
 * then the item's name and price, its details in a ruled grid, and a last
 * row of where, when and whether the price moves, with save, share and
 * report opposite. Every rule runs edge to edge.
 *
 * The specification grid is the part a buyer actually reads, and it is what the
 * search filters were built against — showing specs in the same shape they are
 * filtered in reinforces the platform's one real advantage.
 *
 * Wireframe artboard: `DetailDealer`.
 */

import { getShop, getUser, useViewerId, type SaleListing } from '@snt/core';
import {
  AppHeader,
  Caption,
  CardActions,
  ListingActions,
  OfferButton,
  OffersReceived,
  PhotoGallery,
  PosterRow,
  Screen,
  ScreenBody,
  ShopRow,
  specRowsFor,
} from '@snt/ui';
import { CheckIcon } from '@snt/ui/icons';
import { RevealAction } from '../RevealAction';
import { OwnerControls, StatusTag, contactsShown } from './OwnerTools';
import styles from './SaleDetail.module.css';

export function SaleDetail({ listing }: { listing: SaleListing }) {
  const shop = getShop(listing.shopId);
  const owner = getUser(listing.ownerId);
  /** Your own listing: your panel in place of a buyer's actions. */
  const mine = useViewerId() === listing.ownerId;

  const dropped =
    listing.previousPrice !== undefined &&
    listing.previousPrice > listing.price;

  const facts = specRowsFor(listing.item);
  // Short facts sit two to a row, then the prose ones a row each. An odd
  // number of short ones leaves the last without a neighbour, so an empty
  // cell fills the gap: the grid stays a grid, and its rules run right across.
  const short = facts.filter((fact) => !fact.wide);
  const prose = facts.filter((fact) => fact.wide);

  return (
    <Screen surface>
      {/* The same header as the feed, so the site does not change face on
          the way into a listing. */}
      <AppHeader />

      <div className={styles.panel}>
        {/* The post is one white card: the photo on top, then the item's
            name and price, its details in a ruled grid, and a last row of
            where and when, with save, share and report. */}
        <section className={styles.card}>
          <div className={styles.media}>
            <PhotoGallery
              images={listing.item.images}
              alt={listing.item.name}
              tone={shop ? 'shop' : 'person'}
              className={styles.photo}
            />
          </div>

          {/* Everything under the photo is set in from the card's edges,
              rules too, as the feed card's line above a shop is. */}
          <div className={styles.body}>
            {/* On your own listing, its status comes first. */}
            {mine ? (
              <div className={styles.statusRow}>
                <StatusTag listing={listing} />
              </div>
            ) : null}

            <div className={styles.heading}>
              <h1 className={styles.name}>{listing.item.name}</h1>
              {/* A drop shows the old price struck through beside the new. */}
              <span className={styles.price}>
                {dropped ? (
                  <s className={styles.wasPrice}>
                    <span className="snt-visually-hidden">Was </span>$
                    {listing.previousPrice}
                  </s>
                ) : null}
                ${listing.price}
              </span>
            </div>

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

            {/* The last row: where, when and whether the price moves, with
                save, share and report opposite. */}
            <div className={styles.summary}>
              <ul className={styles.meta}>
                {/* The seller takes a trade-in towards it: said first. */}
                {listing.acceptsSwaps ? (
                  <li className={styles.swapsAccepted}>
                    <CheckIcon size={12} weight={3} />
                    Swaps accepted
                  </li>
                ) : null}
                <li>{listing.location}</li>
                <li>{listing.postedLabel}</li>
                {listing.negotiable ? <li>Negotiable</li> : null}
                {mine ? (
                  <>
                    <li>
                      {listing.viewCount}{' '}
                      {listing.viewCount === 1 ? 'view' : 'views'} today
                    </li>
                    <li>{contactsShown(listing)}</li>
                  </>
                ) : null}
              </ul>
              <CardActions
                listingId={listing.id}
                href={`/listing/${listing.slug}`}
                title={listing.title}
                save={!mine}
                report={!mine}
              />
            </div>

            {/* Changing it, in the card, under all of it. */}
            {mine ? (
              <div className={styles.edit}>
                <OwnerControls listing={listing} />
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <ScreenBody>
        {mine ? null : (
          <>
            <div className={styles.identity}>
              {shop ? (
                <ShopRow shop={shop} />
              ) : owner ? (
                <PosterRow user={owner} />
              ) : null}
            </div>

            {/* What to do about it, right under who is selling it. */}
            <div className={styles.contact}>
              <ListingActions
                caption={
                  <Caption>
                    No account needed · meet in public, check the device before
                    paying
                  </Caption>
                }
              >
                {/* Where the seller takes swaps, a trade-in can be offered
                    straight to them, as an offer: what you have, and any
                    cash on top. */}
                {listing.acceptsSwaps ? (
                  <OfferButton
                    listing={listing}
                    label="Offer a trade in"
                    size="lg"
                    block
                  />
                ) : null}
                <RevealAction
                  listingId={listing.id}
                  ownerId={listing.ownerId}
                  signedInOnly={listing.contactSignedInOnly}
                  block={!listing.acceptsSwaps}
                />
              </ListingActions>
            </div>
          </>
        )}

        {/* Only the owner sees these: the trade-ins offered towards it. */}
        {listing.acceptsSwaps ? <OffersReceived listing={listing} /> : null}
      </ScreenBody>
    </Screen>
  );
}
