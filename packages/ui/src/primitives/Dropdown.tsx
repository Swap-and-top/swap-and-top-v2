'use client';

/**
 * Dropdown — a choice of one from a list, drawn in the app's own style rather
 * than the browser's: a pill like the text boxes, with a blue chevron set in
 * from its end, opening a white list under it.
 *
 * Behaves like a select: click or Enter/Space opens it; the arrow keys move
 * through the options and Enter picks one; Escape, Tab or a click elsewhere
 * closes it. It is a button and a listbox to a screen reader.
 *
 * The list drops down out of the pill as it opens and folds back up into it
 * as it closes, at the same pace as the app's sheets.
 */

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CheckIcon, ChevronRightIcon } from '../icons';
import styles from './Dropdown.module.css';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  /** A second, quieter line, e.g. "Your listing · Good". */
  note?: string;
  /** A count, after the label in a small round, as on the app's tabs. */
  count?: number;
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  labelledBy,
  placeholder = 'Choose',
  className,
}: {
  value: T | undefined;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  /** The id of the visible label it belongs to. */
  labelledBy?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  /** Folding back up: still on screen until it has gone. */
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  /** Folds the list back up into the pill, then takes it away. */
  function close() {
    if (!open || closing) return;
    setClosing(true);
    // In case the end of the fold is never reported.
    closeTimer.current = window.setTimeout(finishClose, 500);
  }

  function finishClose() {
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setOpen(false);
  }
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const chosen = options.find((option) => option.value === value);

  // A click anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function openList() {
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setOpen(true);
  }

  function pick(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    close();
    button.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(active);
    } else if (event.key === 'Escape') {
      // Close the list, not the sheet it sits in.
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') {
      close();
    }
  }

  return (
    <div ref={root} className={styles.root}>
      <button
        ref={button}
        type="button"
        className={[
          styles.trigger,
          open && !closing ? styles.triggerOpen : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelledBy}
        onClick={() => (open && !closing ? close() : openList())}
        onKeyDown={onKeyDown}
      >
        {/* An empty value — "Not stated" — is shown pale, as nothing chosen. */}
        <span
          className={chosen && chosen.value !== '' ? styles.value : styles.placeholder}
        >
          {chosen?.label ?? placeholder}
          {chosen?.count !== undefined ? <span className={styles.count}>{chosen.count}</span> : null}
        </span>
        <ChevronRightIcon size={16} weight={2.2} className={styles.chevron} />
      </button>

      {open ? (
        // The rounded card stays still; the list scrolls inside it, so its
        // corners stay round and the scrollbar sits within them.
        <div
          className={[styles.list, closing ? styles.listClosing : '']
            .filter(Boolean)
            .join(' ')}
          onAnimationEnd={(event) => {
            if (closing && event.target === event.currentTarget) finishClose();
          }}
        >
          <ul id={listId} role="listbox" aria-labelledby={labelledBy} className={styles.scroll}>
            {options.map((option, index) => {
              const selected = option.value === value;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={selected}
                  className={[
                    styles.option,
                    index === active ? styles.optionActive : '',
                    selected ? styles.optionSelected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onPointerEnter={() => setActive(index)}
                  // Picks on press, before the trigger loses focus.
                  onPointerDown={(event) => {
                    event.preventDefault();
                    pick(index);
                  }}
                >
                  <span className={styles.optionText}>
                    <span>
                      {option.label}
                      {option.count !== undefined ? (
                        <span className={styles.count}>{option.count}</span>
                      ) : null}
                    </span>
                    {option.note ? (
                      <span className={styles.note}>{option.note}</span>
                    ) : null}
                  </span>
                  {selected ? <CheckIcon size={14} weight={2.6} /> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
