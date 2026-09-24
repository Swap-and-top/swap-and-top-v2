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
import { SwapIcon } from '../icons';
import { Button } from '../primitives/Button';
import { Panel } from '../primitives/Surface';
import { CashAmount, Eyebrow } from '../primitives/Text';
import { ConfirmedDealsBadge } from '../primitives/Trust';
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
  const isSwapDemand = listing.type === 'swap';
  const tradeIn = listing.type === 'swap' ? listing.has : listing.tradeIn;
  const cash = listing.type === 'swap' ? listing.cashAmount : undefined;
  const wantedName =
    listing.type === 'swap' ? listing.wants.name : listing.wants.name;
  const responses =
    listing.type === 'swap' ? listing.offerCount : listing.responseCount;

  return (
    <Panel xl padded>
      <div className={styles.head}>
        <span
          className={[styles.label, tradeIn ? styles.labelTradeIn : '']
            .filter(Boolean)
            .join(' ')}
        >
          {tradeIn ? <SwapIcon size={13} weight={2.1} /> : null}
          {tradeIn ? 'Wanted — has a trade-in' : 'Wanted'}
        </span>
        <span className={styles.spacer} />
        <span className={styles.age}>{listing.postedLabel}</span>
      </div>

      <Link href={`/listing/${listing.slug}`} className={styles.title}>
        {wantedName}
      </Link>

      <div className={styles.sub}>
        {listing.type === 'request'
          ? `Budget up to $${listing.budget} · ${listing.location}`
          : `${listing.location} · trading up`}
      </div>

      {tradeIn ? (
        <div className={styles.tradeIn}>
          <div className={styles.tradeInBody}>
            <Eyebrow tight>Trading in</Eyebrow>
            <div className={styles.tradeInName}>{tradeIn.name}</div>
          </div>
          {cash ? <CashAmount amount={cash} /> : null}
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button onClick={onRespond}>I have this</Button>
        {responses > 0 ? (
          <span className={styles.responses}>
            {responses} {responses === 1 ? 'response' : 'responses'}
          </span>
        ) : null}
        {requester && !isSwapDemand ? (
          <span className={styles.responses}>
            {requester.displayName}{' '}
            <ConfirmedDealsBadge count={requester.confirmedDeals} />
          </span>
        ) : null}
      </div>
    </Panel>
  );
}
