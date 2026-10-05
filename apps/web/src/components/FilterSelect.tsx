'use client';

/**
 * FilterSelect — a dropdown styled as a pill, for a filter with one choice
 * out of a short list (category, listing type).
 *
 * A native <select>: on a phone it opens the system picker, which is the
 * easiest thing to hit with a thumb, and it needs no script of its own. It
 * fills in when something other than the first, "all" option is chosen, so a
 * narrowed search is visible at a glance.
 *
 * The focus ring is for the keyboard only. A browser rings a dropdown that
 * was clicked or tapped as well, and keeps the ring after the picker shuts —
 * a second outline round a pill that already has one — so the ring is held
 * back while the dropdown is being used by mouse or touch.
 */

import { useState } from 'react';

import { ChevronRightIcon } from '@snt/ui/icons';
import styles from './FilterSelect.module.css';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  /** What the dropdown filters, for screen readers. */
  label: string;
  value: T;
  /** The first option is the unfiltered one, e.g. "All categories". */
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}) {
  const narrowed = value !== options[0]?.value;
  /** Focused by a click or a tap, not by the keyboard. */
  const [byPointer, setByPointer] = useState(false);

  return (
    <div
      className={[styles.wrap, narrowed ? styles.narrowed : '']
        .filter(Boolean)
        .join(' ')}
    >
      <select
        className={[styles.select, byPointer ? styles.byPointer : '']
          .filter(Boolean)
          .join(' ')}
        onPointerDown={() => setByPointer(true)}
        onKeyDown={() => setByPointer(false)}
        onBlur={() => setByPointer(false)}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronRightIcon size={16} weight={2.2} className={styles.chevron} />
    </div>
  );
}
