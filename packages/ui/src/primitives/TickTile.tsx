'use client';

/**
 * TickTile — a yes or no, as a tile: a drawn tick box, the question, and a
 * quiet line of what it means. Set like the offer form's choices: pale blue,
 * ringed in the dark control blue once ticked.
 */

import { CheckIcon } from '../icons';
import styles from './TickTile.module.css';

export function TickTile({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className={[styles.tick, checked ? styles.tickOn : ''].join(' ')}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.tickBox} aria-hidden>
        {checked ? <CheckIcon size={13} weight={3} /> : null}
      </span>
      <span className={styles.tickText}>
        <span className={styles.tickLabel}>{label}</span>
        {hint ? <span className={styles.tickHint}>{hint}</span> : null}
      </span>
    </label>
  );
}
