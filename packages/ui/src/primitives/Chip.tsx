'use client';

/**
 * Chip, ChipRow and ChipWrap.
 *
 * `ChipRow` scrolls horizontally and bleeds to the screen edge — used for the
 * category and type filters above the feed. `ChipWrap` wraps onto multiple
 * lines — used for the specification filters on Search, where every value must
 * be visible at once.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipTone = 'accent' | 'ink';

export interface ChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selected?: boolean;
  /** Which selected colour to use. Category rows use accent, type rows use ink. */
  tone?: ChipTone;
  /** Shorter height, for the secondary type row. */
  small?: boolean;
  /** Square corners, for multi-select specification values. */
  square?: boolean;
  children: ReactNode;
}

export function Chip({
  selected = false,
  tone = 'accent',
  small = false,
  square = false,
  className,
  children,
  ...rest
}: ChipProps) {
  const selectedClass =
    tone === 'ink' ? styles.selectedInk : styles.selectedAccent;

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        styles.chip,
        small ? styles.small : '',
        square ? styles.square : '',
        selected ? selectedClass : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Horizontally scrolling row. */
export function ChipRow({
  children,
  label,
}: {
  children: ReactNode;
  /** Accessible name for the group, e.g. "Filter by category". */
  label: string;
}) {
  return (
    <div className={styles.row} role="group" aria-label={label}>
      {children}
    </div>
  );
}

/** Wrapping group, for specification filters. */
export function ChipWrap({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className={styles.squareWrap} role="group" aria-label={label}>
      {children}
    </div>
  );
}
