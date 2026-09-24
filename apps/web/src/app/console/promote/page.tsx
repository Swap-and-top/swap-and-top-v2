'use client';

/**
 * Console — Promote.
 *
 * Three numbers in the header, and the middle one is the renewal argument:
 * "at least twelve confirmed deals last month" is a far stronger reason to keep
 * paying than a count of people who saw a phone number. The third —
 * sponsored versus organic — is the argument for buying promotion, shown
 * continuously rather than in a sales conversation.
 *
 * Wireframe artboard: `ConsolePromoteM`.
 */

import {
  currentShop,
  mockConsoleStats,
  mockPromotionProducts,
  newLeadCount,
  type PromotionProduct,
} from '@snt/core';
import {
  Badge,
  Button,
  ConsoleShell,
  Eyebrow,
  ImagePlaceholder,
  StatStrip,
} from '@snt/ui';
import { BellIcon, ClockIcon, StarIcon } from '@snt/ui/icons';
import styles from './page.module.css';

function glyphFor(product: PromotionProduct) {
  switch (product.id) {
    case 'lead-alerts':
      return {
        icon: <BellIcon size={18} weight={1.9} />,
        className: styles.glyphActive,
      };
    case 'sponsored-slot':
      return {
        icon: <StarIcon size={18} weight={1.9} />,
        className: styles.glyphAccent,
      };
    default:
      return {
        icon: <ClockIcon size={18} weight={1.8} />,
        className: styles.glyphDark,
      };
  }
}

export default function ConsolePromotePage() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Promote"
      newLeadCount={newLeadCount}
      actions={
        <StatStrip
          className={styles.stats}
          stats={[
            { value: mockConsoleStats.revealsSevenDays, label: 'reveals, 7d' },
            {
              value: mockConsoleStats.confirmedDealsThirtyDays,
              label: 'deals, 30d',
              tone: 'success',
            },
            {
              value: mockConsoleStats.sponsoredLift,
              label: 'sponsored lift',
            },
          ]}
        />
      }
    >
      <div className={styles.cards}>
        {mockPromotionProducts.map((product) => {
          const glyph = glyphFor(product);

          return (
            <div key={product.id} className={styles.card}>
              <span className={[styles.glyph, glyph.className].join(' ')}>
                {glyph.icon}
              </span>

              <div className={styles.body}>
                <div className={styles.head}>
                  <span className={styles.name}>{product.name}</span>
                  {product.active ? <Badge tone="success">Active</Badge> : null}
                </div>

                <p className={styles.description}>
                  {product.description} {product.priceLabel}.
                  {product.detail ? ` ${product.detail}.` : ''}
                </p>

                {product.actionLabel ? (
                  <div className={styles.actions}>
                    <Button
                      variant={product.id === 'drop-slot' ? 'outline' : 'primary'}
                      size="sm"
                    >
                      {product.actionLabel}
                    </Button>
                    {product.meta ? (
                      <span className={styles.meta}>{product.meta}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.performer}>
        <Eyebrow>Best performer this week</Eyebrow>
        <div className={styles.performerRow}>
          <ImagePlaceholder height={44} width={44} small />
          <div className={styles.performerBody}>
            <div className={styles.performerName}>
              {mockConsoleStats.bestPerformer.label}
            </div>
            <div className={styles.performerMeta}>
              {mockConsoleStats.bestPerformer.reveals} reveals
              {mockConsoleStats.bestPerformer.sponsored ? ' · sponsored' : ''}
            </div>
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
