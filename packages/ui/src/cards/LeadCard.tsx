'use client';

/**
 * LeadCard — the Store console's most important component.
 *
 * When demonstrating the platform to a store, this is the screen to open
 * twenty seconds in: here is someone who wants what you stock, here is what
 * they are swapping in, here is the cash, and here is your matching item.
 *
 * A lead is someone's Wanted listing, so it is set as the Wanted card in the
 * feed is: the green label on its icon tiles, the item wanted as the green
 * title, the facts small and grey, what they have in its strip with a photo,
 * and who is asking with the little person mark. Then what the store does:
 * the match, and the buttons.
 */

import type { ReactNode } from 'react';
import type { Lead } from '@snt/core';
import { swapTerms } from '../format';
import {
  BellIcon,
  BinocularsIcon,
  CheckIcon,
  InfoIcon,
  SwapIcon,
} from '../icons';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { PhotoThumb } from '../primitives/PhotoGallery';
import { specSummary } from '../primitives/SpecGrid';
import { Panel } from '../primitives/Surface';
import { CashAmount, Eyebrow, ItemName } from '../primitives/Text';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { SellerIcon } from './SellerIcon';
import styles from './LeadCard.module.css';

/** What kind of listing the lead is, on its small icon tile, as on the
    feed's cards: "Wanted" in green for a request, "Swap" in the swap blue
    for a swap (someone with something to swap posts a swap, not a Wanted). */
export function LeadLabel({ lead }: { lead: Lead }) {
  const swap = lead.demand.type === 'swap';
  return (
    <span
      className={[styles.label, swap ? styles.labelSwap : '']
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.labelIcon}>
        {swap ? <SwapIcon size={14} /> : <BinocularsIcon size={14} />}
      </span>
      {swap ? 'Swap' : 'Wanted'}
    </span>
  );
}

/** The facts under the title: where, and the budget or who adds cash. */
export function leadFacts(lead: Lead): string[] {
  const { demand } = lead;
  if (demand.type === 'request') {
    return [lead.area, `Budget up to $${demand.budget}`];
  }
  const { cashNote } = swapTerms(
    demand.cashDirection,
    demand.cashAmount,
    false,
    demand.cashUpTo,
  );
  return [lead.area, cashNote];
}

/** "Alerted by WhatsApp · 10:42", as the lead's alert was sent. */
export function leadAlertLine(lead: Lead): string | null {
  if (!lead.alert) return null;
  const how = lead.alert.via.includes('whatsapp')
    ? 'Alerted by WhatsApp'
    : 'Alerted in the app';
  return `${how} · ${lead.alert.at}`;
}

/** What they have to swap, in its strip: photo, name, and the cash; with
    `details`, its specs and any faults under the name, where there is room. */
export function LeadTradeIn({
  lead,
  details = false,
}: {
  lead: Lead;
  details?: boolean;
}) {
  const { demand } = lead;
  if (demand.type !== 'swap') return null;
  const tradeIn = demand.has;
  const cash = demand.cashDirection === 'i-add' ? demand.cashAmount : undefined;
  return (
    <div className={styles.tradeIn}>
      <PhotoThumb images={tradeIn.images ?? []} alt={tradeIn.name} tone="wanted" />
      <div className={styles.tradeInBody}>
        <Eyebrow tight>Has</Eyebrow>
        <ItemName side="owned" bold className={styles.tradeInName}>
          {tradeIn.name}
        </ItemName>
        {details ? (
          <span className={styles.tradeInDetails}>
            {specSummary(tradeIn, 4)}
            {tradeIn.defects ? ` · ${tradeIn.defects}` : ''}
          </span>
        ) : null}
      </div>
      {cash && demand.cashUpTo ? (
        <span className={styles.upTo}>
          <span className={styles.upToWords}>+ up to</span> ${cash}
        </span>
      ) : cash ? (
        <CashAmount amount={cash} />
      ) : null}
    </div>
  );
}

export function LeadCard({
  lead,
  onOffer,
  contact,
}: {
  lead: Lead;
  onOffer?: () => void;
  /**
   * The way to their contact details, under the offer button. None where
   * they keep them back until they accept an offer: a line says so instead.
   */
  contact?: ReactNode;
}) {
  const alert = leadAlertLine(lead);

  return (
    <Panel xl className={styles.card}>
      <div className={styles.head}>
        <LeadLabel lead={lead} />
        <span className={styles.spacer} />
        {lead.isNew ? <Badge tone="brand">New</Badge> : null}
        <span className={styles.age}>{lead.receivedAt}</span>
      </div>

      <div className={styles.title}>{lead.demand.wants.name}</div>
      <div className={styles.sub}>
        {leadFacts(lead).map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </div>
      {alert ? (
        <div className={styles.alerted}>
          <BellIcon size={12} />
          {alert}
        </div>
      ) : null}

      <LeadTradeIn lead={lead} />

      {lead.matchedStockLabel ? (
        <div className={styles.match}>
          <CheckIcon size={14} weight={2.6} />
          Matches your {lead.matchedStockLabel}
        </div>
      ) : (
        <div className={styles.noMatch}>
          <InfoIcon size={14} weight={1.9} />
          Nothing matching in your stock
        </div>
      )}

      {/* Who is asking, as a poster is named on the cards in the feed. */}
      <div className={styles.footer}>
        <span className={styles.requesterName}>
          <SellerIcon kind="person" />
          {lead.requester.displayName}
        </span>
        <ConfirmedDealsBadge count={lead.requester.confirmedDeals} />
      </div>

      <div className={styles.actions}>
        {lead.matchedStockLabel ? (
          <Button onClick={onOffer}>Send an offer</Button>
        ) : (
          <Button variant="secondary" onClick={onOffer}>
            I can source this
          </Button>
        )}
        {contact}
      </div>

      {contact ? null : (
        <div className={styles.noMatch}>
          <InfoIcon size={14} weight={1.9} />
          Their contact details are shared only if they accept your offer.
        </div>
      )}
    </Panel>
  );
}
