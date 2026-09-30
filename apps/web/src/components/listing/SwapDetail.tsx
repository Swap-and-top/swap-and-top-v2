'use client';

/**
 * Swap listing detail.
 *
 * Note the primary action: "I have this — make an offer", not "contact seller".
 * A swap is a proposal, so the natural response is a counter-proposal.
 * Revealing the number is secondary.
 *
 * Defects are shown in the specification grid rather than buried — a trade-in's
 * flaws are exactly what a counterparty needs, and hiding them produces failed
 * meetings and reports.
 *
 * Wireframe artboard: `DetailSwap`.
 */

import {
  getUser,
  useSavedStore,
  type SwapListing,
} from '@snt/core';
import {
  Button,
  Caption,
  Eyebrow,
  HeaderIconButton,
  PosterRow,
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  SpecGrid,
  specRowsFor,
  SwapTiles,
  swapTerms,
} from '@snt/ui';
import { PhoneIcon, SaveStarIcon, ShareIcon } from '@snt/ui/icons';
import { useRevealStore } from '@snt/core';
import styles from './SwapDetail.module.css';

export function SwapDetail({ listing }: { listing: SwapListing }) {
  const owner = getUser(listing.ownerId);
  const { ids, toggle } = useSavedStore();
  const { reveal, revealed } = useRevealStore();
  const saved = ids.includes(listing.id);
  const number = revealed[listing.id];

  /** Who pays — worded as on the cards. */
  const terms = swapTerms(listing.cashDirection, listing.cashAmount);

  return (
    <Screen surface>
      <ScreenHeader
        backHref="/"
        title="Swap & Top"
        accentTitle
        actions={
          <>
            <HeaderIconButton
              label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={() => toggle(listing.id)}
            >
              <SaveStarIcon size={20} filled={saved} />
            </HeaderIconButton>
            <HeaderIconButton label="Share on WhatsApp">
              <ShareIcon size={20} />
            </HeaderIconButton>
          </>
        }
      />

      {/* The swap panel — the reason this screen exists. */}
      <div className={styles.panel}>
        <SwapTiles
          has={listing.has}
          wants={listing.wants}
          cashAmount={listing.cashAmount}
          cashDirection={listing.cashDirection}
          flush
        />
        <div className={styles.direction}>
          {terms.cashNote}
        </div>
      </div>

      <ScreenBody>
        <Eyebrow className={styles.specsLabel}>Has</Eyebrow>
        <SpecGrid rows={specRowsFor(listing.has)} />

        <div className={styles.identity}>
          {owner ? <PosterRow user={owner} /> : null}
        </div>

        <div className={styles.activity}>
          {listing.viewCount} people viewed this today · {listing.offerCount}{' '}
          {listing.offerCount === 1 ? 'offer' : 'offers'} made
        </div>
      </ScreenBody>

      <ScreenFooter
        caption={
          <Caption>
            Meet in public · check the device is not locked before swapping
          </Caption>
        }
      >
        <Button size="lg" block>
          I have this — make an offer
        </Button>
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
