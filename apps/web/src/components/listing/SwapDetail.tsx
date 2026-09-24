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
  ImagePlaceholder,
  PosterRow,
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  SpecGrid,
  specRowsFor,
} from '@snt/ui';
import { BookmarkIcon, PhoneIcon, ShareIcon, SwapIcon } from '@snt/ui/icons';
import { useRevealStore } from '@snt/core';
import styles from './SwapDetail.module.css';

export function SwapDetail({ listing }: { listing: SwapListing }) {
  const owner = getUser(listing.ownerId);
  const { ids, toggle } = useSavedStore();
  const { reveal, revealed } = useRevealStore();
  const saved = ids.includes(listing.id);
  const number = revealed[listing.id];

  /** From the viewer's point of view, so "I add" reads as "they add". */
  const directionLabel =
    listing.cashDirection === 'i-add'
      ? 'they add'
      : listing.cashDirection === 'they-add'
        ? 'you add'
        : 'straight swap';

  return (
    <Screen surface>
      <ScreenHeader
        backHref="/"
        title="Swap &amp; Top"
        accentTitle
        actions={
          <>
            <HeaderIconButton
              label={saved ? 'Remove from saved' : 'Save listing'}
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

      {/* The swap panel — the reason this screen exists. */}
      <div className={styles.panel}>
        <div className={styles.tiles}>
          <div className={styles.tile}>
            <ImagePlaceholder height={104} onTint />
          </div>

          <div className={styles.middle}>
            <span className={styles.arrows}>
              <SwapIcon size={21} weight={2.1} />
            </span>
            {listing.cashAmount ? (
              <span className={styles.amount}>+${listing.cashAmount}</span>
            ) : null}
            <span className={styles.direction}>{directionLabel}</span>
          </div>

          {/* Dashed and never photographed: they do not own this yet. */}
          <div className={styles.tile}>
            <ImagePlaceholder height={104} onTint wanted glyph="search" />
          </div>
        </div>

        <div className={styles.labels}>
          <div className={styles.labelCol}>
            <Eyebrow tight>They have</Eyebrow>
            <div className={styles.itemName}>{listing.has.name}</div>
          </div>
          <span className={styles.labelSpacer} />
          <div className={styles.labelCol}>
            <Eyebrow tight accent>
              They want
            </Eyebrow>
            <div className={styles.itemName}>{listing.wants.name}</div>
          </div>
        </div>
      </div>

      <ScreenBody>
        <Eyebrow className={styles.specsLabel}>
          What they are trading in
        </Eyebrow>
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
