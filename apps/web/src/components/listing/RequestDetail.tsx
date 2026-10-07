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
} from '@snt/core';
import {
  AppHeader,
  Body,
  Caption,
  CardActions,
  Eyebrow,
  ItemName,
  Note,
  OfferButton,
  OffersReceived,
  Panel,
  PosterRow,
  Price,
  Screen,
  ScreenBody,
  ScreenFooter,
  SpecGrid,
  specRowsFor,
  Stack,
} from '@snt/ui';
import { InfoIcon } from '@snt/ui/icons';
import { RevealAction } from '../RevealAction';
import styles from './RequestDetail.module.css';

export function RequestDetail({ listing }: { listing: RequestListing }) {
  const owner = getUser(listing.ownerId);
  const offers = useOfferStore((store) => store.offers);
  const responses = offerCountFor(offers, listing.id, listing.responseCount);

  return (
    <Screen surface>
      {/* The same header as the feed, so the site does not change face on
          the way into a listing. Save and share are in the page. */}
      <AppHeader />

      <ScreenBody>
        <Stack gap={6}>
          {/* What they want on the left; save and share at the right. */}
          <div className={styles.lead}>
            <div className={styles.leadText}>
              <Eyebrow>Looking for</Eyebrow>
              <Body>
                <ItemName side="wanted">{listing.wants.name}</ItemName>
              </Body>
            </div>
            <CardActions
              listingId={listing.id}
              href={`/listing/${listing.slug}`}
              title={listing.title}
              tone="wanted"
              report
            />
          </div>

          <div>
            {/* With something to swap, the budget is cash they add on top. */}
            <Eyebrow>{listing.tradeIn ? 'They add up to' : 'Budget'}</Eyebrow>
            <Price amount={listing.budget} size="lg" />
          </div>

          {listing.tradeIn ? (
            <Panel padded>
              <Eyebrow tight>Has</Eyebrow>
              <Body>
                <ItemName side="owned">{listing.tradeIn.name}</ItemName>
              </Body>
              <SpecGrid rows={specRowsFor(listing.tradeIn)} />
            </Panel>
          ) : null}

          {owner ? <PosterRow user={owner} /> : null}

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

      <ScreenFooter
        caption={<Caption>No account needed · meet in public</Caption>}
      >
        {/* Opens the offer sheet. On your own post it leads to its offers. */}
        <OfferButton listing={listing} size="lg" block />
        <RevealAction
          listingId={listing.id}
          ownerId={listing.ownerId}
          block={false}
        />
      </ScreenFooter>
    </Screen>
  );
}
