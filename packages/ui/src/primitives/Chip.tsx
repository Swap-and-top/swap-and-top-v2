'use client';

/**
 * Chip, ChipRow and ChipWrap.
 *
 * `ChipRow` scrolls horizontally and bleeds to the screen edge — used for the
 * category filter above the feed. `ChipWrap` wraps onto multiple lines — used
 * for the specification filters on Search, where every value must be visible
 * at once.
 *
 * A chip is a filter you switch on and off. Where the values are exhaustive
 * and only one can hold at a time, use `Tabs` instead — that is what Browse
 * does for listing type.
 */

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipTone = 'accent' | 'ink';

export interface ChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selected?: boolean;
  /** Which selected colour to use. Accent for a filter that narrows a feed,
   *  ink where a second chip row needs to stay distinct from the first. */
  tone?: ChipTone;
  /** Shorter height, for a secondary row under a primary one. */
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
  // The selected fill enters a chip from the side of the one selected before
  // it, while that one dissolves. Which way that is has to be
  // known before the selection changes, so it is noted on the row as a chip is
  // pressed — ahead of the chip's own handler — for the CSS to read.
  function noteDirection(event: MouseEvent<HTMLDivElement>) {
    const row = event.currentTarget;
    const next = (event.target as HTMLElement).closest('button');
    const current = row.querySelector('button[aria-pressed="true"]');
    if (!next || !current || next === current || !row.contains(next)) return;
    const after =
      current.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING;
    row.dataset.travel = after ? 'forward' : 'back';
  }

  return (
    <div
      className={styles.row}
      role="group"
      aria-label={label}
      onClickCapture={noteDirection}
    >
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
