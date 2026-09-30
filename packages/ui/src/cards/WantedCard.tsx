'use client';

/**
 * WantedCard — demand, from either source.
 *
 * Takes a `DemandListing`, so a request and a swap-seen-as-demand render through
 * the same card. A swap arrives with a trade-in strip, which is what makes it
 * the higher-value lead.
 *
 * Note the structure differs from the wireframe in one way: the card is not one
 * big link. A `<button>` cannot live inside an `<a>` — it is invalid HTML and
 * the anchor swallows the click. So the title is the link and "I have this" is a
 * real sibling button.
 */

import Link from 'next/link';
import type { DemandListing, User } from '@snt/core';
import { Button } from '../primitives/Button';
import { PhotoThumb } from '../primitives/PhotoGallery';
import { Panel } from '../primitives/Surface';
import { CashAmount, Eyebrow, ItemName } from '../primitives/Text';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { swapTerms } from '../format';
import { CardActions } from './CardActions';
import styles from './WantedCard.module.css';

export function WantedCard({
  listing,
  requester,
  onRespond,
}: {
  listing: DemandListing;
  requester?: User;
  /** "I have this". In the real app this opens the offer composer. */
  onRespond?: () => void;
}) {
  const tradeIn = listing.type === 'swap' ? listing.has : listing.tradeIn;
  const terms =
    listing.type === 'swap'
      ? swapTerms(listing.cashDirection, listing.cashAmount)
      : undefined;
  // The cash rides with what they have only when they are the ones adding it.
  const cash =
    listing.type === 'swap' && terms?.cashSide === 'has'
      ? listing.cashAmount
      : undefined;
  const wantedName =
    listing.type === 'swap' ? listing.wants.name : listing.wants.name;
  const responses =
    listing.type === 'swap' ? listing.offerCount : listing.responseCount;

  return (
    // An individual's request is tinted green; a shop's would stay grey.
    <Panel
      xl
      className={[styles.card, listing.shopId ? '' : styles.person]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.head}>
        <span
          className={[styles.label, tradeIn ? styles.labelTradeIn : '']
            .filter(Boolean)
            .join(' ')}
        >
          {tradeIn ? 'Wanted + Swap' : 'Wanted'}
        </span>
        <span className={styles.spacer} />
        {/* The small grey facts sit together, top right. */}
        <span className={styles.age}>
          {responses > 0
            ? `${responses} ${responses === 1 ? 'response' : 'responses'} · `
            : ''}
          {listing.postedLabel}
        </span>
      </div>

      {/* What they want on the left; the button on the right, where it
          balances the text instead of sitting under it. */}
      <div className={styles.main}>
        <div className={styles.info}>
          <Link href={`/listing/${listing.slug}`} className={styles.title}>
            {wantedName}
          </Link>

          <div className={styles.sub}>
            {listing.type === 'request' ? (
              <>
                {/* With a trade-in, the budget is cash on top of it. */}
                <span>
                  {tradeIn
                    ? `Up to $${listing.budget} cash + what they have`
                    : `Budget up to $${listing.budget}`}
                </span>
                <span>{listing.location}</span>
              </>
            ) : (
              <>
                <span>{listing.location}</span>
                <span>{terms?.label}</span>
                {terms?.cashSide ? <span>{terms.cashNote}</span> : null}
              </>
            )}
          </div>
        </div>

        <Button onClick={onRespond} className={styles.cta}>
          I have this
        </Button>
      </div>

      {tradeIn ? (
        <div className={styles.tradeIn}>
          {/* What they are offering is theirs, so it can be pictured; what
              they want never is. Opens the viewer on the Wanted green. */}
          <PhotoThumb
            images={tradeIn.images ?? []}
            alt={tradeIn.name}
            tone="wanted"
          />
          <div className={styles.tradeInBody}>
            <Eyebrow tight>Has</Eyebrow>
            <ItemName side="owned" className={styles.tradeInName}>
              {tradeIn.name}
            </ItemName>
          </div>
          {cash ? <CashAmount amount={cash} /> : null}
        </div>
      ) : null}

      {/* Who is asking, then save and share far right — the same bottom row
          as the sale and swap cards, so the icons are always in one place. */}
      <div className={styles.footer}>
        {requester ? (
          <>
            <span className={styles.requesterName}>
              {requester.displayName}
            </span>
            <ConfirmedDealsBadge count={requester.confirmedDeals} />
          </>
        ) : null}
        <span className={styles.spacer} />
        <CardActions
          listingId={listing.id}
          href={`/listing/${listing.slug}`}
          title={listing.title}
        />
      </div>
    </Panel>
  );
}
