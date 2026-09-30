/**
 * Small display formatters.
 *
 * All of these are deterministic and locale-independent on purpose. Anything
 * that reads the current clock or the browser locale produces one string on the
 * server and a different one in the browser, which React reports as a hydration
 * mismatch. When real timestamps arrive, relative times belong behind a
 * client-only boundary — see the note on `postedLabel` in `@snt/core`.
 */

import type { CashDirection } from '@snt/core';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** '2026-08-04' → 'Aug 2026'. */
export function monthYear(isoDate: string): string {
  const [year, month] = isoDate.split('-');
  if (!year || !month) return isoDate;
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : year;
}

/** 2 → 'Usually replies within 2h'. Undefined when there is not enough data. */
export function replyLabel(hours: number | undefined): string | undefined {
  if (hours === undefined) return undefined;
  if (hours < 1) return 'Usually replies within the hour';
  return `Usually replies within ${hours}h`;
}

/** 1 → '< 1h', 3 → '3h'. For the compact shopfront statistic. */
export function replyShort(hours: number): string {
  return hours <= 1 ? '< 1h' : `${hours}h`;
}

/** How a swap's cash reads, from the viewer's side. */
export interface SwapTerms {
  /** "Trading up", "Trading down" or "Straight swap". */
  label: string;
  /** Who pays: "They add $240", "You add $60" or "No cash either way". */
  cashNote: string;
  /** The tile the cash rides on: the side that comes with money. */
  cashSide: 'has' | 'wants' | null;
}

/**
 * The one place a swap's direction is put into words, so every card and
 * screen says it the same way. "They" is the poster; "you" is whoever takes
 * the swap.
 *
 *  - Trading up: the poster's item is worth less, so they add cash. The cash
 *    rides on their "Has" side.
 *  - Trading down: the poster's item is worth more, so you add cash. The cash
 *    rides on the "Looking for" side — what you bring.
 *  - Straight swap: equal value, no cash.
 */
export function swapTerms(
  direction: CashDirection,
  amount: number | undefined,
): SwapTerms {
  if (!amount || direction === 'straight') {
    return {
      label: 'Straight swap',
      cashNote: 'No cash either way',
      cashSide: null,
    };
  }
  if (direction === 'i-add') {
    return {
      label: 'Trading up',
      cashNote: `They add $${amount}`,
      cashSide: 'has',
    };
  }
  return {
    label: 'Trading down',
    cashNote: `You add $${amount}`,
    cashSide: 'wants',
  };
}
