/**
 * StatStrip — the bordered row of numbers.
 *
 * Keep it to three on a phone. Four fits, but the labels start wrapping and the
 * strip stops being scannable, which is the only reason it exists.
 */

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
