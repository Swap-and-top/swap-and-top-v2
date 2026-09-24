'use client';

/**
 * Form fields.
 *
 * Every input has a real `<label>` tied to it by id — including the ones the
 * wireframes draw with only a placeholder, where the label is visually hidden
 * rather than absent.
 */

import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Field.module.css';

export interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id'> {
  label: string;
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean;
  /** Sentence-case helper line under the label. */
  hint?: string;
  size?: 'sm' | 'md';
  /** Display face and larger type, for a cash amount. */
  strong?: boolean;
  /** Pill shape, for a header search box. */
  pill?: boolean;
  /** Filled background, for a search box on a white header. */
  filled?: boolean;
  className?: string;
}

export function Field({
  label,
  hideLabel = false,
  hint,
  size = 'md',
  strong = false,
  pill = false,
  filled = false,
  className,
  ...rest
}: FieldProps) {
  const id = useId();

  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <label
        htmlFor={id}
        className={hideLabel ? 'snt-visually-hidden' : styles.label}
      >
        {label}
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </label>
      <input
        id={id}
        className={[
          styles.input,
          size === 'sm' ? styles.inputSm : '',
          strong ? styles.inputStrong : '',
          pill ? styles.inputPill : '',
          filled ? styles.inputFilled : '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
    </div>
  );
}

/** Two or more fields side by side. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function CheckboxField({
  label,
  checked,
  onChange,
  divided = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Separated from the group above by a rule. */
  divided?: boolean;
}) {
  const id = useId();

  return (
    <div
      className={[styles.checkRow, divided ? styles.checkRowDivided : '']
        .filter(Boolean)
        .join(' ')}
    >
      <input
        id={id}
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id} className={styles.checkLabel}>
        {label}
      </label>
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Segmented control. Used for the swap cash direction, where the three states
 * must all be visible — a dropdown would hide the choice that explains the flow.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={[
            styles.segment,
            option.value === value ? styles.segmentActive : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
