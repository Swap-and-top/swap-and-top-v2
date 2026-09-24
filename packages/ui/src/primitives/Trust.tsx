/**
 * Trust signals: verified dealer, and confirmed deals.
 *
 * These are the only two trust markers on the platform.
 *
 * `ConfirmedDealsBadge` returns nothing when the count is zero. That is
 * deliberate: a zero reads as a warning, an absence reads as new, and new is
 * what it actually means.
 */

import { CheckIcon } from '../icons';
import styles from './Trust.module.css';

export type TrustSize = 'sm' | 'md';

/** A registered business stands behind this listing. The only badge. */
export function VerifiedDealerBadge({
  size = 'sm',
  label = 'Verified',
}: {
  size?: TrustSize;
  /** "Verified" on a compact card, "Verified dealer" where there is room. */
  label?: string;
}) {
  return (
    <span
      className={[styles.signal, styles.verified, size === 'md' ? styles.md : '']
        .filter(Boolean)
        .join(' ')}
    >
      <CheckIcon size={size === 'md' ? 12 : 11} weight={3} />
      {label}
    </span>
  );
}

/** Deals both parties confirmed completed. Earnable by anyone. */
export function ConfirmedDealsBadge({
  count,
  size = 'sm',
  /** "3 deals" on a card, "3 confirmed deals" where there is room. */
  long = false,
}: {
  count: number;
  size?: TrustSize;
  long?: boolean;
}) {
  if (count <= 0) return null;

  const noun = long
    ? count === 1
      ? 'confirmed deal'
      : 'confirmed deals'
    : count === 1
      ? 'deal'
      : 'deals';

  return (
    <span
      className={[styles.signal, styles.deals, size === 'md' ? styles.md : '']
        .filter(Boolean)
        .join(' ')}
    >
      <CheckIcon size={size === 'md' ? 12 : 11} weight={2.6} />
      {count} {noun}
    </span>
  );
}
