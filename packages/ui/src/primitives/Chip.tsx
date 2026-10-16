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

import { useRef } from 'react';
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  PointerEvent,
  ReactNode,
} from 'react';
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
  fill = false,
}: {
  children: ReactNode;
  /** Accessible name for the group, e.g. "Filter by category". */
  label: string;
  /**
   * Stretch the chips to fill the row while there is room. As the row
   * narrows they give the room back, down to their own size, and only then
   * does the row scroll.
   */
  fill?: boolean;
}) {
  // The selected fill enters a chip from the side of the one selected before
  // it, while that one dissolves. Which way that is has to be
  // known before the selection changes, so it is noted on the row as a chip is
  // pressed — ahead of the chip's own handler — for the CSS to read.
  function noteDirection(event: MouseEvent<HTMLDivElement>) {
    // The end of a drag is not a tap: the chip under the mouse stays as it is.
    if (drag.current?.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current = null;
      return;
    }
    const row = event.currentTarget;
    const next = (event.target as HTMLElement).closest('button');
    const current = row.querySelector('button[aria-pressed="true"]');
    if (!next || !current || next === current || !row.contains(next)) return;
    const after =
      current.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING;
    row.dataset.travel = after ? 'forward' : 'back';
  }

  /*
   * Dragging with a mouse. A finger or a trackpad scrolls the row by itself,
   * but a mouse cannot drag a scrolling row — so here it can: press, drag
   * sideways, let go. A press that hardly moves is still a tap on the chip.
   */
  const drag = useRef<{
    id: number;
    x: number;
    scroll: number;
    moved: boolean;
  } | null>(null);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const row = event.currentTarget;
    if (row.scrollWidth <= row.clientWidth) return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      scroll: row.scrollLeft,
      moved: false,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const row = event.currentTarget;
    const dx = event.clientX - state.x;
    if (!state.moved && Math.abs(dx) > 5) {
      state.moved = true;
      // Keep following the mouse even off the row, until it is let go.
      row.setPointerCapture(event.pointerId);
      row.dataset.dragging = 'true';
    }
    if (state.moved) row.scrollLeft = state.scroll - dx;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    delete event.currentTarget.dataset.dragging;
    // A drag leaves its state for the click that follows to swallow.
    if (!state.moved) drag.current = null;
    else window.setTimeout(() => (drag.current = null), 0);
  }

  return (
    <div
      className={[styles.row, fill ? styles.rowFill : '']
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={label}
      onClickCapture={noteDirection}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // No browser drag of a chip's text or the row as an image.
      onDragStart={(event) => event.preventDefault()}
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
