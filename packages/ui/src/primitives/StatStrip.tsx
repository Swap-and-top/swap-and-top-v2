/**
 * StatStrip — the bordered row of numbers.
 *
 * Keep it to three on a phone. Four fits, but the labels start wrapping and the
 * strip stops being scannable, which is the only reason it exists.
 */

import { Bone } from './Skeleton';
import styles from './StatStrip.module.css';

export interface Stat {
  value: string | number;
  label: string;
  /** Renders the number in the trust amber. Use it for confirmed deals. */
  tone?: 'default' | 'trust';
}

export function StatStrip({
  stats,
  className,
}: {
  stats: Stat[];
  className?: string;
}) {
  return (
    <div className={[styles.strip, className ?? ''].filter(Boolean).join(' ')}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.stat}>
          <div
            className={[
              styles.value,
              stat.tone === 'trust' ? styles.valueTrust : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {stat.value}
          </div>
          <div className={styles.label}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/** The strip while its numbers load: the same cells, a bone for each value. */
export function StatStripSkeleton({
  labels,
  className,
}: {
  /** The labels never change, so they show at once. */
  labels: string[];
  className?: string;
}) {
  return (
    <div
      className={[styles.strip, className ?? ''].filter(Boolean).join(' ')}
      aria-hidden
    >
      {labels.map((label) => (
        <div key={label} className={styles.stat}>
          <div className={styles.value}>
            <Bone width={36} height={20} style={{ margin: '1px 0' }} />
          </div>
          <div className={styles.label}>{label}</div>
        </div>
      ))}
    </div>
  );
}
