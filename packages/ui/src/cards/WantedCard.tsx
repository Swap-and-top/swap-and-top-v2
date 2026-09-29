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
import { CashAmount, Eyebrow, ItemName } from '../primitives/Text';
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
    <Panel xl className={styles.card}>
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

      {/* What they want on the left; the response on the right, where it
          balances the text instead of sitting under it. */}
      <div className={styles.main}>
        <div className={styles.info}>
          <Link href={`/listing/${listing.slug}`} className={styles.title}>
            {wantedName}
          </Link>

          <div className={styles.sub}>
            {listing.type === 'request' ? (
              <>
                <span>Budget up to ${listing.budget}</span>
                <span>{listing.location}</span>
              </>
            ) : (
              <>
                <span>{listing.location}</span>
                <span>trading up</span>
              </>
            )}
          </div>

          {/* Who is asking, set like the trust line on the other cards. */}
          {requester && !isSwapDemand ? (
            <div className={styles.requester}>
              <span className={styles.requesterName}>
                {requester.displayName}
              </span>
              <ConfirmedDealsBadge count={requester.confirmedDeals} />
            </div>
          ) : null}
        </div>

        <div className={styles.cta}>
          <Button onClick={onRespond}>I have this</Button>
          {responses > 0 ? (
            <span className={styles.responses}>
              {responses} {responses === 1 ? 'response' : 'responses'}
            </span>
          ) : null}
        </div>
      </div>

      {tradeIn ? (
        <div className={styles.tradeIn}>
          <div className={styles.tradeInBody}>
            <Eyebrow tight>Trading in</Eyebrow>
            <ItemName side="owned" className={styles.tradeInName}>
              {tradeIn.name}
            </ItemName>
          </div>
          {cash ? <CashAmount amount={cash} /> : null}
        </div>
      ) : null}
    </Panel>
  );
}
