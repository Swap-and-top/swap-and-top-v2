'use client';

/**
 * Deal confirmation.
 *
 * Three answers, no free text, no stars. Two rules shape the whole screen:
 *
 *  1. **Your answer is never shown to the other party**, and saying no carries
 *     no consequence for anyone. Both facts are stated on screen, because
 *     otherwise people answer strategically instead of honestly.
 *  2. **It is not a complaint channel.** A "no" means no deal happened, not
 *     that someone behaved badly. If something went wrong that is a report,
 *     which is a separate mechanism with reasons, review and appeal — hence a
 *     small button apart from the answers rather than a fourth answer.
 *
 * Wireframe artboard: `DealConfirm`.
 */

import Link from 'next/link';
import {
  getListing,
  getShop,
  getUser,
  useDealStore,
  type DealConfirmation,
} from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  ImagePlaceholder,
  listingPhoto,
  Note,
  Screen,
  ScreenBody,
  specSummary,
} from '@snt/ui';
import { CheckIcon, ChevronRightIcon, ShieldIcon } from '@snt/ui/icons';
import styles from './DealConfirm.module.css';

export function DealConfirm({
  confirmation,
}: {
  confirmation: DealConfirmation;
}) {
  const { answer, answers, confirmedDeals } = useDealStore();
  const given = answers[confirmation.id] ?? 'unanswered';

  const listing = getListing(confirmation.listingId);
  const seller = getUser(confirmation.sellerId);
  const shop = getShop(seller?.shopId);

  const sellerName = shop?.name ?? seller?.displayName ?? 'the seller';

  return (
    <Screen>
      {/* The feed's own header, as on every page. */}
      <AppHeader />

      <ScreenBody>
        {/* The question, the listing it is about, and the answers: one
            white card, as the forms are. */}
        <section className={styles.card}>
        <h1 className={styles.heading}>Did the deal go through?</h1>
        <p className={styles.intro}>
          You got {sellerName}&rsquo;s number three days ago.
        </p>

        {listing ? (
            <Link href={`/listing/${listing.slug}`} className={styles.summary}>
              <ImagePlaceholder
                src={listingPhoto(listing)}
                height={54}
                width={54}
                small
              />
              <span className={styles.summaryBody}>
                <span className={styles.summaryTitle}>
                  {listing.type === 'sale'
                    ? specSummary(listing.item)
                    : listing.title}
                </span>
                <span className={styles.summaryMeta}>
                  {listing.type === 'sale' ? `$${listing.price} · ` : ''}
                  {sellerName}
                </span>
              </span>
              <span className={styles.chevron}>
                <ChevronRightIcon size={17} />
              </span>
            </Link>
        ) : null}

        {given === 'unanswered' || given === 'not-yet' ? (
          <>
            <div className={styles.answers}>
              <Button
                variant="success"
                size="lg"
                block
                onClick={() => answer(confirmation.id, 'yes')}
              >
                <CheckIcon size={19} weight={2.6} />
                Yes, we completed it
              </Button>
              <Button
                variant="secondary"
                size="lg"
                block
                onClick={() => answer(confirmation.id, 'no')}
              >
                No, it did not happen
              </Button>
              <Button
                variant="secondary"
                size="lg"
                block
                onClick={() => answer(confirmation.id, 'not-yet')}
              >
                Not yet, ask me later
              </Button>
            </div>

            <Note
              icon={<ShieldIcon size={17} />}
              className={styles.privacy}
            >
              Both of you have to say yes before it counts.{' '}
              <strong>Your answer is never shown to them</strong>, and saying no
              has no consequence for anyone.
            </Note>

            {/* A report is its own thing, apart from the answers: a small
                button under the note, not a fourth answer. */}
            <div className={styles.report}>
              <span className={styles.reportAsk}>Something go wrong?</span>
              <ButtonLink href="/me" variant="secondary" size="sm">
                Report this listing
              </ButtonLink>
            </div>
          </>
        ) : (
          <div className={styles.answered}>
            <CheckIcon size={22} weight={2.6} />
            <div className={styles.answeredBody}>
              <div className={styles.answeredTitle}>
                {given === 'yes' ? 'Counted' : 'Thanks, nothing recorded'}
              </div>
              <div className={styles.answeredNote}>
                {given === 'yes'
                  ? 'Both of you confirmed, so this is now on your record.'
                  : 'No deal was counted. Nobody is told what you answered.'}
              </div>
            </div>
          </div>
        )}
        </section>

        {/* What it adds up to: a card of its own. */}
        <section className={[styles.card, styles.record].join(' ')}>
          <h2 className={styles.label}>Your record</h2>
          <div className={styles.recordRow}>
            <span className={styles.recordCount}>
              <CheckIcon size={17} weight={2.6} />
              <span className={styles.recordNumber}>{confirmedDeals}</span>
            </span>
            <span className={styles.recordLabel}>
              confirmed deals, shown on your listings
            </span>
          </div>
          <p className={styles.recordNote}>
            This is how buyers judge a private seller. There are no badges for
            who you are or what you do, only what you have actually done.
          </p>
        </section>
      </ScreenBody>
    </Screen>
  );
}
