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
  useSavedStore,
  type RequestListing,
} from '@snt/core';
import {
  Body,
  Button,
  Caption,
  Eyebrow,
  HeaderIconButton,
  Note,
  Panel,
  PosterRow,
  Price,
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  SpecGrid,
  Stack,
  specRowsFor,
} from '@snt/ui';
import { BookmarkIcon, InfoIcon, ShareIcon } from '@snt/ui/icons';
import { RevealAction } from '../RevealAction';

export function RequestDetail({ listing }: { listing: RequestListing }) {
  const owner = getUser(listing.ownerId);
  const { ids, toggle } = useSavedStore();
  const saved = ids.includes(listing.id);

  return (
    <Screen surface>
      <ScreenHeader
        backHref="/wanted"
        title="Wanted"
        actions={
          <>
            <HeaderIconButton
              label={saved ? 'Remove from saved' : 'Save request'}
              onClick={() => toggle(listing.id)}
            >
              <BookmarkIcon size={20} filled={saved} />
            </HeaderIconButton>
            <HeaderIconButton label="Share on WhatsApp">
              <ShareIcon size={20} />
            </HeaderIconButton>
          </>
        }
      />

      <ScreenBody>
        <Stack gap={6}>
          <div>
            <Eyebrow>Looking for</Eyebrow>
            <Body>{listing.wants.name}</Body>
          </div>

          <div>
            <Eyebrow>Budget</Eyebrow>
            <Price amount={listing.budget} size="lg" />
          </div>

          {listing.tradeIn ? (
            <Panel padded>
              <Eyebrow tight>Has a trade-in</Eyebrow>
              <Body>{listing.tradeIn.name}</Body>
              <SpecGrid rows={specRowsFor(listing.tradeIn)} />
            </Panel>
          ) : null}

          {owner ? <PosterRow user={owner} /> : null}

          <Note icon={<InfoIcon size={17} />} tone="subtle">
            {listing.responseCount > 0
              ? `${listing.responseCount} ${listing.responseCount === 1 ? 'person has' : 'people have'} responded. `
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
        <Button size="lg" block>
          I have this
        </Button>
        <RevealAction
          listingId={listing.id}
          ownerId={listing.ownerId}
          block={false}
        />
      </ScreenFooter>
    </Screen>
  );
}
