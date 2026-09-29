'use client';

/**
 * LeadCard — the dealer console's most important component.
 *
 * When demonstrating the platform to a dealer, this is the screen to open
 * twenty seconds in: here is someone who wants what you stock, here is what
 * they are trading in, here is the cash, and here is your matching item.
 */

import type { Lead } from '@snt/core';
import { CheckIcon, InfoIcon, PhoneIcon } from '../icons';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Panel } from '../primitives/Surface';
import { CashAmount, Eyebrow, ItemName } from '../primitives/Text';
import styles from './LeadCard.module.css';

export function LeadCard({
  lead,
  onOffer,
  onReveal,
}: {
  lead: Lead;
  onOffer?: () => void;
  onReveal?: () => void;
}) {
  const { demand } = lead;
  const tradeIn = demand.type === 'swap' ? demand.has : demand.tradeIn;
  const cash = demand.type === 'swap' ? demand.cashAmount : undefined;
  const budget = demand.type === 'request' ? demand.budget : undefined;

  return (
    <Panel padded accent={lead.isNew}>
      <div className={styles.head}>
        {lead.isNew ? <Badge tone="accentSolid">New</Badge> : null}
        <span className={styles.age}>
          {lead.receivedAt} · {lead.area}
        </span>
      </div>

      <div className={styles.title}>
        Wants <ItemName side="wanted">{demand.wants.name}</ItemName>
      </div>

      {budget !== undefined ? (
        <div className={styles.sub}>
          Budget up to ${budget} · cash ready{tradeIn ? '' : ' · no trade-in'}
        </div>
      ) : null}

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

      <div className={styles.actions}>
        {lead.matchedStockLabel ? (
          <Button onClick={onOffer}>Send an offer</Button>
        ) : (
          <Button variant="secondary" onClick={onOffer}>
            I can source this
          </Button>
        )}
        {lead.matchedStockLabel ? (
          <Button
            variant="secondary"
            iconOnly
            aria-label="Show their number"
            onClick={onReveal}
          >
            <PhoneIcon size={18} />
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}
