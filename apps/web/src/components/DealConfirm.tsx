'use client';

/**
 * Deal confirmation.
 *
 * Three answers, no free text, no stars. Who is asked, and when, is in
 * `packages/core/src/types/deal.ts`: an accepted offer asks both people; a
 * number reveal asks the person who revealed, and the listing's owner only
 * once they say yes.
 * Two rules shape the whole screen:
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
  getStore,
  getUser,
  isOwnerOn,
  myAnswerOn,
  otherPartyOn,
  theirAnswerOn,
  useDealStore,
  viewerId,
  viewerOn,
  type DealConfirmation,
} from '@snt/core';
import {
  AppHeader,
  Bone,
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
  const given = myAnswerOn(confirmation, answers);

  const listing = getListing(confirmation.listingId);
  const owner = isOwnerOn(confirmation);
  /** A store answering from its console, rather than the signed in user:
      its own record, and back to Leads. */
  const viewer = viewerOn(confirmation);
  const asStore = viewer !== viewerId();
  const otherName = otherNameOn(confirmation);
  /** A yes counts only once the other side has said yes too. */
  const counted = given === 'yes' && theirAnswerOn(confirmation) === 'yes';
  /** The record it adds to: the signed in user's, or the store's own. */
  const record = asStore
    ? (getUser(viewer)?.confirmedDeals ?? 0) + (counted ? 1 : 0)
    : confirmedDeals;

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
          {dealReason(confirmation, otherName, true)}
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
                  {otherName}
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
                {owner ? 'Report this person' : 'Report this listing'}
              </ButtonLink>
            </div>
          </>
        ) : (
          <div className={styles.answered}>
            <CheckIcon size={22} weight={2.6} />
            <div className={styles.answeredBody}>
              <div className={styles.answeredTitle}>
                {counted
                  ? 'Counted'
                  : given === 'yes'
                    ? `Waiting for ${otherName}`
                    : 'Thanks, nothing recorded'}
              </div>
              <div className={styles.answeredNote}>
                {counted
                  ? 'Both of you confirmed, so this is now on your record.'
                  : given === 'yes'
                    ? confirmation.source === 'reveal'
                      ? `We will ask ${otherName} to confirm it too. It counts once they say yes.`
                      : `It counts once ${otherName} says yes too.`
                    : 'No deal was counted. Nobody is told what you answered.'}
              </div>
            </div>
          </div>
        )}

        {/* Back to where it was opened from, as a button. */}
        <ButtonLink
          href={asStore ? '/console/leads' : '/me/deals'}
          variant="secondary"
          block
        >
          {asStore ? 'Back to leads' : 'Back to deals to confirm'}
        </ButtonLink>
        </section>

        {/* What it adds up to: a card of its own. */}
        <section className={[styles.card, styles.record].join(' ')}>
          <h2 className={styles.label}>Your record</h2>
          <div className={styles.recordRow}>
            <span className={styles.recordCount}>
              <span className={styles.recordNumber}>{record}</span>
            </span>
            <span className={styles.recordLabel}>
              confirmed deals, shown on your listings
            </span>
          </div>
          <p className={styles.recordNote}>
            {asStore
              ? 'Buyers see it on your storefront and your listings, beside your verified badge.'
              : 'This is how buyers judge a private seller. There are no badges for who you are or what you do, only what you have actually done.'}
          </p>
        </section>
      </ScreenBody>
    </Screen>
  );
}

/** The other person on the deal, by their store's name where they have one. */
export function otherNameOn(deal: DealConfirmation): string {
  const other = getUser(otherPartyOn(deal));
  return getStore(other?.storeId)?.name ?? other?.displayName ?? 'Someone';
}

/**
 * Why the user is being asked, in a line: an accepted offer, or a number
 * reveal, from whichever side they are on. `long` adds when, for the deal
 * check itself.
 */
export function dealReason(
  deal: DealConfirmation,
  otherName: string,
  long = false,
): string {
  const when = long ? ' three days ago' : '';
  if (deal.source === 'offer') {
    return isOwnerOn(deal)
      ? `You accepted ${possessive(otherName)} offer${when}.`
      : `${otherName} accepted your offer${when}.`;
  }
  return isOwnerOn(deal)
    ? `${otherName} got your number and says the deal went through.`
    : `You got ${possessive(otherName)} number${when}.`;
}

/** "Chipo N." as "Chipo N.\u2019s", "Kopje Computers" as "Kopje Computers\u2019". */
function possessive(name: string): string {
  return name.endsWith('s') ? `${name}\u2019` : `${name}\u2019s`;
}

/**
 * The deal check while it loads: the question and every fixed line are the
 * page's own; the listing it is about, the answers and the count wait in
 * bones in their places.
 */
export function DealConfirmSkeleton() {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <section className={styles.card} aria-busy aria-label="Loading">
          <h1 className={styles.heading}>Did the deal go through?</h1>
          <Bone width="60%" height={17} className={styles.intro} />
          <div className={styles.summary}>
            <Bone shape="block" width={44} height={44} />
            <span className={styles.summaryBody}>
              <Bone width="80%" height={15} />
              <Bone width="50%" height={15} style={{ marginTop: 4 }} />
              <Bone width="40%" height={11} style={{ marginTop: 8 }} />
            </span>
          </div>
          <div className={styles.answers}>
            <Bone shape="pill" height={48} />
            <Bone shape="pill" height={48} />
            <Bone shape="pill" height={48} />
          </div>
          <Note icon={<ShieldIcon size={17} />} className={styles.privacy}>
            Both of you have to say yes before it counts.{' '}
            <strong>Your answer is never shown to them</strong>, and saying no
            has no consequence for anyone.
          </Note>
          <div className={styles.report}>
            <span className={styles.reportAsk}>Something go wrong?</span>
            <Bone shape="pill" width={150} height={36} />
          </div>
        </section>

        <section className={[styles.card, styles.record].join(' ')}>
          <h2 className={styles.label}>Your record</h2>
          <div className={styles.recordRow}>
            <Bone width={44} height={32} />
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
