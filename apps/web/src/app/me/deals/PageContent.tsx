'use client';

/**
 * Deals to confirm: every deal the user is asked about, one card each.
 *
 * Two tabs: those still waiting on their answer (including "not yet"), and
 * those they have answered. Each card is the listing in brief, why they are
 * asked (an accepted offer, or a number reveal) and when, and a button into
 * the deal check (/deals/[id]/confirm), where the answer is given.
 *
 * Only deals the user has been asked about are here: on a reveal of their
 * own number they are asked only once the other person says yes.
 */

import { useState } from 'react';
import {
  awaitsMyAnswer,
  getListing,
  myAnswerOn,
  myDealConfirmations,
  theirAnswerOn,
  useDealStore,
  type DealAnswer,
  type DealConfirmation,
  type Listing,
} from '@snt/core';
import {
  AppHeader,
  ButtonLink,
  ImagePlaceholder,
  Screen,
  ScreenBody,
  SignInGate,
  Tabs,
  listingPhoto,
  type TabItem,
} from '@snt/ui';
import {
  BinocularsIcon,
  ChevronRightIcon,
  SwapIcon,
  TagIcon,
} from '@snt/ui/icons';
import { dealReason, otherNameOn } from '@/components/DealConfirm';
import styles from './page.module.css';

type View = 'waiting' | 'answered';

export default function DealsPage() {
  const [view, setView] = useState<View>('waiting');
  const answers = useDealStore((store) => store.answers);

  const waiting = myDealConfirmations.filter((deal) =>
    awaitsMyAnswer(deal, answers),
  );
  const answered = myDealConfirmations.filter(
    (deal) => !awaitsMyAnswer(deal, answers),
  );
  const shown = view === 'waiting' ? waiting : answered;

  const tabs: TabItem<View>[] = [
    { value: 'waiting', label: 'To confirm', count: waiting.length },
    { value: 'answered', label: 'Answered', count: answered.length },
  ];

  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>Deals to confirm</h1>
        <Tabs
          fill
          tabs={tabs}
          active={view}
          onChange={setView}
          label="Deals to confirm or answered"
        />
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          {shown.length > 0 ? (
            <div className={styles.list}>
              {shown.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  given={myAnswerOn(deal, answers)}
                />
              ))}
            </div>
          ) : (
            <p className={styles.none}>
              {view === 'waiting'
                ? 'Nothing to confirm. A few days after an offer is accepted, or you get someone\u2019s number, we ask here whether the deal went through.'
                : 'You have not answered any deals yet. Your answers appear here once you give them.'}
            </p>
          )}
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}

/** What kind of listing it is, in a word, with the feed's icon for it. */
const KIND = {
  sale: { label: 'For sale', icon: <TagIcon size={16} /> },
  swap: { label: 'Swap', icon: <SwapIcon size={16} /> },
  request: { label: 'Wanted', icon: <BinocularsIcon size={16} /> },
  auction: { label: 'Auction', icon: <TagIcon size={16} /> },
} as const;

/** How the deal stands, as a faded pill of its own colour. */
const STATUS = {
  unanswered: { label: 'Waiting for you', tone: styles.waiting },
  'not-yet': { label: 'Ask me later', tone: styles.later },
  them: { label: 'Waiting for them', tone: styles.later },
  yes: { label: 'Completed', tone: styles.yes },
  no: { label: 'Did not happen', tone: styles.no },
};

/** A yes is complete only once the other side has said yes too. */
function statusOf(deal: DealConfirmation, given: DealAnswer) {
  if (given === 'yes' && theirAnswerOn(deal) !== 'yes') return STATUS.them;
  return STATUS[given];
}

/**
 * One deal: the listing's photo, kind and status, its name and price or
 * terms, who it was with and when the user was asked, and a button into the
 * deal check.
 */
function DealCard({
  deal,
  given,
}: {
  deal: DealConfirmation;
  given: DealAnswer;
}) {
  const listing = getListing(deal.listingId);
  if (!listing) return null;

  const kind = KIND[listing.type];
  const photo = listingPhoto(listing);
  const status = statusOf(deal, given);
  const open = given === 'unanswered' || given === 'not-yet';

  return (
    <section className={styles.card}>
      <div className={styles.main}>
        {photo ? (
          <ImagePlaceholder
            src={photo}
            height={72}
            width={72}
            small
            className={styles.thumb}
          />
        ) : (
          <span className={styles.thumbWanted} aria-hidden>
            <BinocularsIcon size={28} />
          </span>
        )}

        <div className={styles.text}>
          <div className={styles.kindRow}>
            <span
              className={[
                styles.kind,
                listing.type === 'request' ? styles.kindWanted : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.kindIcon}>{kind.icon}</span>
              {kind.label}
            </span>
            <span className={[styles.status, status.tone].join(' ')}>
              {status.label}
            </span>
          </div>
          <p className={styles.name}>{listing.title}</p>
          <p className={styles.terms}>{termsFor(listing)}</p>
          <p className={styles.meta}>
            {dealReason(deal, otherNameOn(deal)).replace(/\.$/, '')} · Asked{' '}
            {dayMonth(deal.promptedAt)}
          </p>
        </div>
      </div>

      <ButtonLink
        href={`/deals/${deal.id}/confirm`}
        variant={open ? 'blue' : 'secondary'}
        size="sm"
        className={styles.open}
      >
        {open ? 'Confirm this deal' : 'View your answer'}
        <ChevronRightIcon size={16} />
      </ButtonLink>
    </section>
  );
}

/** Its price, swap or budget, in one short line. */
function termsFor(listing: Listing): string {
  switch (listing.type) {
    case 'sale':
      return `$${listing.price}`;
    case 'swap':
      return `Swap for ${listing.wants.name}`;
    case 'request':
      return `Budget up to $${listing.budget}`;
    default:
      return `$${listing.currentBid ?? listing.startingPrice}`;
  }
}

/** "2026-09-24" as "24 Sep". */
function dayMonth(iso: string): string {
  const [, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[(month ?? 1) - 1]}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
