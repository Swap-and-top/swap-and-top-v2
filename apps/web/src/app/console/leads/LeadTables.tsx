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

/** Where the deal check stands, with the shop's own answer taken in. */
type DealStage = NumberReveal['deal'] | 'closed';

const DEAL_BADGE: Record<DealStage, { tone: BadgeTone; label: string }> = {
  waiting: { tone: 'neutral', label: '' },
  asked: { tone: 'accent', label: 'Answer needed' },
  confirmed: { tone: 'success', label: 'Deal confirmed' },
  closed: { tone: 'neutral', label: 'No deal' },
};

/** The stage, once the shop has answered: yes confirms it (they said yes
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
        const user = getUser(reveal.userId);
        const listing = getListing(reveal.listingId);
        const stage = stageOf(reveal, answers);
        /** Who it was, only once they say a deal went through: until then
            the shop is told nothing about them beyond their area. */
        const named = stage !== 'waiting';
        const name = named
          ? (user?.displayName ?? 'Someone')
          : `Someone in ${reveal.area}`;
        const item =
          listing && listing.type === 'sale' ? listing.item.name : listing?.title;
        const price =
          listing && listing.type === 'sale' && listing.price > 0
            ? listing.price
            : undefined;
        const way = reveal.way === 'whatsapp' ? 'WhatsApp' : 'Call';
        const deal = DEAL_BADGE[stage];
        const dealLabel =
          stage === 'waiting'
            ? `Asking them in ${reveal.daysToAsk ?? 3} days`
            : deal.label;

        return (
          <div key={reveal.id} className={styles.row}>
            {/* Only a row waiting on the shop's answer opens anything: its
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
            <span className={styles.badge}>
              <Badge tone={deal.tone}>{dealLabel}</Badge>
            </span>
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
