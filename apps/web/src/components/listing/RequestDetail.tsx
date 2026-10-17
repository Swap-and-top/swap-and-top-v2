'use client';

/**
 * Request listing detail.
 *
 * The lightest of the three, because a request has no photographs and no
 * specification table of its own — only what is wanted, a budget, and possibly a
 * trade-in. The primary action is "I have this", which is the lead.
 *
 * There is no dedicated artboard for this screen; it follows the Wanted card's
 * structure at full size.
 */

import {
  getUser,
  type RequestListing,
  offerCountFor,
  useOfferStore,
  useViewerId,
} from '@snt/core';
import {
  AppHeader,
  Body,
  Caption,
  CardActions,
  Eyebrow,
  ItemName,
  ListingActions,
  Note,
  OfferButton,
  OffersReceived,
  Panel,
  PosterRow,
  Price,
  Screen,
  ScreenBody,
  SpecGrid,
  specRowsFor,
  Stack,
} from '@snt/ui';
import { InfoIcon } from '@snt/ui/icons';
import { RevealAction } from '../RevealAction';
import { OwnerControls, StatusTag, contactsShown } from './OwnerTools';
import styles from './RequestDetail.module.css';

export function RequestDetail({ listing }: { listing: RequestListing }) {
  const owner = getUser(listing.ownerId);
  const offers = useOfferStore((store) => store.offers);
  const responses = offerCountFor(offers, listing.id, listing.responseCount);
  /** Your own post: worded from your side, with your panel in place of a
      buyer's actions. */
  const mine = useViewerId() === listing.ownerId;

  return (
    <Screen surface>
      {/* The same header as the feed, so the site does not change face on
          the way into a listing. Save and share are in the page. */}
      <AppHeader />

      <ScreenBody>
        <Stack gap={6}>
          {/* On your own post, its status comes first. */}
          {mine ? <StatusTag listing={listing} /> : null}

          {/* What they want on the left; save and share at the right. */}
          <div className={styles.lead}>
            <div className={styles.leadText}>
              <Eyebrow>{mine ? 'You are looking for' : 'Looking for'}</Eyebrow>
              <Body>
                <ItemName side="wanted">{listing.wants.name}</ItemName>
              </Body>
            </div>
            <CardActions
              listingId={listing.id}
              href={`/listing/${listing.slug}`}
              title={listing.title}
              tone="wanted"
              save={!mine}
              report={!mine}
            />
          </div>

          <div>
            {/* With something to swap, the budget is cash they add on top. */}
            <Eyebrow>
              {listing.tradeIn
                ? mine
                  ? 'You add up to'
                  : 'They add up to'
                : mine
                  ? 'Your budget'
                  : 'Budget'}
            </Eyebrow>
            <Price amount={listing.budget} size="lg" />
            {/* How your post is doing: yours to see. */}
            {mine ? (
              <div className={styles.ownerMeta}>
                {listing.viewCount}{' '}
                {listing.viewCount === 1 ? 'view' : 'views'} today ·{' '}
                {contactsShown(listing)}
              </div>
            ) : null}
          </div>

          {listing.tradeIn ? (
            <Panel padded>
              <Eyebrow tight>{mine ? 'You have' : 'Has'}</Eyebrow>
              <Body>
                <ItemName side="owned">{listing.tradeIn.name}</ItemName>
              </Body>
              <SpecGrid rows={specRowsFor(listing.tradeIn)} />
            </Panel>
          ) : null}

          {mine ? <OwnerControls listing={listing} /> : null}

          {!mine && owner ? <PosterRow user={owner} /> : null}

          {/* What to do about it, right under who posted it. */}
          {mine ? null : (
            <ListingActions
              caption={
                <Caption>
                  Meet in public · check the item before you pay
                </Caption>
              }
            >
              {/* Opens the offer sheet. */}
              <OfferButton listing={listing} size="lg" block />
              <RevealAction
                listingId={listing.id}
                ownerId={listing.ownerId}
                signedInOnly={listing.contactSignedInOnly}
                block={false}
              />
            </ListingActions>
          )}

          {/* Only the owner sees these: the offers made on this post. */}
          <OffersReceived listing={listing} />

          <Note icon={<InfoIcon size={17} />} tone="subtle">
            {responses > 0
              ? `${responses} ${responses === 1 ? 'person has' : 'people have'} responded. `
              : ''}
            {listing.allowDealerOffers
              ? 'This person accepts offers from dealers.'
              : 'This person has turned off dealer offers.'}
          </Note>
        </Stack>
      </ScreenBody>
    </Screen>
  );
}
