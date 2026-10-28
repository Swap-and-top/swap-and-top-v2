'use client';

/**
 * The Number reveals tab of Leads, as a table set exactly as
 * Stock's is: from a wide screen, one white card with a dark blue band of
 * column headings and rows parted by thin lines; between a tablet and a wide
 * screen, cards two to a row; on a phone, a card per row with the key facts.
 * A long list stays easy to scan.
 */

import Link from 'next/link';
import {
  getListing,
  getUser,
  useDealStore,
  type NumberReveal,
} from '@snt/core';
import { Badge, SellerIcon, type BadgeTone } from '@snt/ui';
import { PhoneIcon, WhatsAppIcon } from '@snt/ui/icons';
import styles from './LeadTables.module.css';

/* ------------------------------------------------------ number reveals --- */

/** Where the deal check stands, with the store's own answer taken in. */
type DealStage = NumberReveal['deal'] | 'closed';

const DEAL_BADGE: Record<DealStage, { tone: BadgeTone; label: string }> = {
  waiting: { tone: 'neutral', label: '' },
  asked: { tone: 'accent', label: 'Answer needed' },
  confirmed: { tone: 'success', label: 'Deal confirmed' },
  closed: { tone: 'neutral', label: 'No deal' },
};

/** What each pill means, shown on hover. */
function dealHint(stage: DealStage, days: number): string {
  switch (stage) {
    case 'waiting':
      return `In ${days} ${days === 1 ? 'day' : 'days'} we ask them whether they bought it from you. If they say yes, we ask you to confirm, and the deal counts on both your records.`;
    case 'asked':
      return 'They say they bought it from you. Confirm it, or say it did not happen, so your record stays right.';
    case 'confirmed':
      return 'You both said the deal happened. It counts towards your confirmed deals.';
    default:
      return 'No deal: one of you said it did not happen.';
  }
}

/** How each way reads in the table. */
const WAY_LABEL: Record<NumberReveal['way'], string> = {
  whatsapp: 'WhatsApp',
  call: 'Call',
  email: 'Email',
  messenger: 'Messenger',
};

/** The stage, once the store has answered: yes confirms it (they said yes
    first), no closes it; not yet leaves it asked. */
function stageOf(reveal: NumberReveal, answers: Record<string, string>): DealStage {
  const given = reveal.dealId ? answers[reveal.dealId] : undefined;
  if (reveal.deal === 'asked' && given === 'yes') return 'confirmed';
  if (reveal.deal === 'asked' && given === 'no') return 'closed';
  return reveal.deal;
}

export function RevealsTable({ reveals }: { reveals: NumberReveal[] }) {
  const answers = useDealStore((store) => store.answers);
  return (
    <div className={[styles.list, styles.reveals].join(' ')}>
      {/* Wide screens only: the column headings. */}
      <div className={styles.headerRow} aria-hidden>
        <span />
        <span>Listing</span>
        <span>Who</span>
        <span>Contact</span>
        <span className={styles.alignRight}>Price</span>
        <span>When</span>
        <span className={styles.alignRight}>Their deals</span>
        <span>Deal check</span>
      </div>

      {reveals.map((reveal) => {
        // Named by the API once they may be; the sample data by its id.
        const user = reveal.name
          ? { displayName: reveal.name, confirmedDeals: reveal.confirmedDeals ?? 0 }
          : getUser(reveal.userId);
        const listing = getListing(reveal.listingId);
        const stage = stageOf(reveal, answers);
        /** Who it was, only once they say a deal went through: until then
            the store is told nothing about them beyond their area. */
        const named = stage !== 'waiting';
        const name = named
          ? (user?.displayName ?? 'Someone')
          : reveal.guest
            ? 'A guest'
            : `Someone in ${reveal.area || 'Harare'}`;
        const item =
          listing && listing.type === 'sale' ? listing.item.name : listing?.title;
        const price =
          listing && listing.type === 'sale' && listing.price > 0
            ? listing.price
            : undefined;
        const way = WAY_LABEL[reveal.way];
        const deal = DEAL_BADGE[stage];
        // A guest is never asked: no deal check to wait for.
        const hint = reveal.guest
          ? 'They were not signed in, so nobody is asked whether a deal happened.'
          : dealHint(stage, reveal.daysToAsk ?? 3);
        const days = reveal.daysToAsk ?? 3;
        const dealLabel = reveal.guest
          ? 'No deal check'
          : stage === 'waiting'
            ? // When we will ask them whether they bought it, worded as the
              // column and the store's own check are: a deal check.
              days === 0
              ? 'Deal check today'
              : `Deal check in ${days} ${days === 1 ? 'day' : 'days'}`
            : deal.label;

        return (
          <div key={reveal.id} className={styles.row}>
            {/* Only a row waiting on the store's answer opens anything: its
                deal check. The rest have nothing to do, so stay still. */}
            {stage === 'asked' && reveal.dealId ? (
              <Link
                href={`/deals/${reveal.dealId}/confirm`}
                className={styles.rowLink}
                aria-label={`${name}, on your ${item}: answer the deal check`}
              />
            ) : null}
            <span className={styles.tile} aria-hidden>
              {reveal.way === 'whatsapp' ? (
                <WhatsAppIcon size={17} />
              ) : (
                <PhoneIcon size={17} />
              )}
            </span>
            {/* The item first, plainly: the person after it is the lead. */}
            <span className={styles.listing}>{item}</span>
            {/* Who, as a seller is named on a listing card: the little
                person mark, then the name; grey while it is only an area. */}
            <span
              className={[styles.revealer, named ? styles.revealerNamed : '']
                .filter(Boolean)
                .join(' ')}
            >
              <SellerIcon kind="person" />
              {name}
            </span>
            <span className={styles.way}>{way}</span>
            <span className={styles.price}>
              {price !== undefined ? `$${price}` : null}
            </span>
            <span className={styles.when}>{reveal.atLabel}</span>
            <span className={styles.deals}>
              {named ? (user?.confirmedDeals ?? 0) : null}
            </span>
            {/* What the pill means, on hover. Answer needed opens the deal
                check from the pill too, as the rest of the row does. */}
            {stage === 'asked' && reveal.dealId ? (
              <Link
                href={`/deals/${reveal.dealId}/confirm`}
                className={styles.badge}
                title={hint}
                tabIndex={-1}
                aria-hidden
              >
                <Badge tone={deal.tone}>{dealLabel}</Badge>
              </Link>
            ) : (
              <span className={styles.badge} title={hint}>
                <Badge tone={deal.tone}>{dealLabel}</Badge>
              </span>
            )}
            {/* A phone's card: how and when, in one quiet line. */}
            <span className={styles.phoneMeta}>
              {way} · {reveal.atLabel}
              {named ? ` · ${reveal.area}` : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
