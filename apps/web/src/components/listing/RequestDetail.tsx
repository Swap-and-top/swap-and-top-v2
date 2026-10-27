'use client';

/**
 * Request listing detail.
 *
 * Set as a sale listing is (see SaleDetail): one white card with the item,
 * the budget, the details in a ruled grid, and a last row of where and
 * when. A wanted item is never photographed, so the card has no picture:
 * it starts with the item, in the green of what is wanted. A wanted post is
 * cash only; someone with something to trade in posts a swap. The primary
 * action is "Make an offer", which is the lead.
 */

import {
  getUser,
  type RequestListing,
  offerCountFor,
  useOfferStore,
  useViewerId,
  type Item,
} from '@snt/core';
import {
  AppHeader,
  Caption,
  CardActions,
  ListingActions,
  Note,
  OfferButton,
  OffersReceived,
  PosterRow,
  Screen,
  ScreenBody,
  specRowsFor,
  Stack,
} from '@snt/ui';
import { InfoIcon } from '@snt/ui/icons';
import {
  KEPT_BACK_NOTE,
  RevealAction,
  useContactKeptBack,
} from '../RevealAction';
import { OwnerControls, StatusTag, contactsShown } from './OwnerTools';
import card from './SaleDetail.module.css';
import styles from './RequestDetail.module.css';
import { PreviewBanner } from './PreviewBanner';
import { SponsorBanner } from '../sponsor/SponsorBanner';
import sponsorStyles from '../sponsor/SponsorBanner.module.css';

export function RequestDetail({
  listing,
  preview = false,
}: {
  listing: RequestListing;
  /**
   * A buyer preview, for the owner: the page exactly as a buyer sees it, the
   * owner's own tools hidden, under a banner saying so.
   */
  preview?: boolean;
}) {
  const owner = getUser(listing.ownerId);
  const offers = useOfferStore((store) => store.offers);
  const responses = offerCountFor(offers, listing.id, listing.responseCount);
  /** Your own post: worded from your side, with your controls in place of a
      buyer's actions. */
  const viewer = useViewerId();
  const mine = !preview && viewer === listing.ownerId;
  /** The poster shares their details only once they accept an offer. */
  const keptBack = useContactKeptBack(listing);

  const budgetLabel = mine ? 'Your budget, up to' : 'Budget up to';

  return (
    <Screen surface>
      {/* The same header as the feed, so the site does not change face on
          the way into a listing. */}
      <AppHeader />
      {preview ? <PreviewBanner /> : null}

      <div className={card.panel}>
        {/* Your own Wanted listing: Sponsor this item, above its card. */}
        {mine ? (
          <SponsorBanner listing={listing} className={sponsorStyles.above} />
        ) : null}
        <section className={card.card}>
          <div className={card.body}>
            {/* On your own post, its status comes first. */}
            {mine ? (
              <div className={card.statusRow}>
                <StatusTag listing={listing} />
              </div>
            ) : null}

            {/* The item wanted, its budget opposite. */}
            <div className={card.heading}>
              <div className={styles.what}>
                <span className={styles.kicker}>
                  {mine ? 'You are looking for' : 'Looking for'}
                </span>
                <h1 className={[card.name, styles.wantedName].join(' ')}>
                  {listing.wants.name}
                </h1>
              </div>
              <span className={styles.budget}>
                <span className={styles.kicker}>{budgetLabel}</span>
                <span className={card.price}>${listing.budget}</span>
              </span>
            </div>

            <FactGrid item={listing.wants} />

            {/* The last row: where and when, with save, share and report
                opposite. */}
            <div className={card.summary}>
              <ul className={card.meta}>
                <li>{listing.location}</li>
                <li>{listing.postedLabel}</li>
                {mine ? (
                  <>
                    <li>
                      {listing.viewCount}{' '}
                      {listing.viewCount === 1 ? 'view' : 'views'} today
                    </li>
                    <li>{contactsShown(listing)}</li>
                  </>
                ) : (
                  <li>
                    {responses} {responses === 1 ? 'response' : 'responses'}
                  </li>
                )}
              </ul>
              <CardActions
                listingId={listing.id}
                href={`/listing/${listing.slug}`}
                title={listing.title}
                tone="wanted"
                save={!mine}
                report={!mine}
              />
            </div>

            {/* Changing it, in the card, under all of it. */}
            {mine ? (
              <div className={card.edit}>
                <OwnerControls listing={listing} />
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <ScreenBody>
        <Stack gap={6}>
          {!mine && owner ? <PosterRow user={owner} /> : null}

          {/* What to do about it, right under who posted it. */}
          {mine ? null : (
            <ListingActions
              caption={
                <Caption>
                  {keptBack
                    ? KEPT_BACK_NOTE
                    : 'Meet in public · check the item before you pay'}
                </Caption>
              }
            >
              {/* Opens the offer sheet. */}
              <OfferButton
                listing={listing}
                size="lg"
                block
                preview={preview}
              />
              {keptBack ? null : (
                <RevealAction
                  listingId={listing.id}
                  ownerId={listing.ownerId}
                  signedInOnly={listing.contactSignedInOnly}
                  block={false}
                />
              )}
            </ListingActions>
          )}

          {/* Only the owner sees these: the offers made on this post. */}
          {preview ? null : <OffersReceived listing={listing} />}

          {/* For whoever might offer: not on your own post (shown again
              when you preview it as a buyer sees it). */}
          {mine ? null : (
            <Note icon={<InfoIcon size={17} />} tone="subtle">
              {listing.allowDealerOffers
                ? 'This person accepts offers from dealers.'
                : 'This person has turned off dealer offers.'}
            </Note>
          )}
        </Stack>
      </ScreenBody>
    </Screen>
  );
}

/**
 * An item's details in the card's ruled grid: short facts two to a row,
 * prose a row each, an odd one out matched with an empty cell so every rule
 * runs across.
 */
function FactGrid({ item }: { item: Item }) {
  const facts = specRowsFor(item);
  if (facts.length === 0) return null;
  const short = facts.filter((fact) => !fact.wide);
  const prose = facts.filter((fact) => fact.wide);
  return (
    <dl className={card.facts}>
      {short.map((fact) => (
        <div key={fact.label} className={card.fact}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
      {short.length % 2 === 1 ? <div className={card.fact} aria-hidden /> : null}
      {prose.map((fact) => (
        <div key={fact.label} className={[card.fact, card.factWide].join(' ')}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
