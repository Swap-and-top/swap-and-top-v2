/**
 * Small display formatters.
 *
 * All of these are deterministic and locale-independent on purpose. Anything
 * that reads the current clock or the browser locale produces one string on the
 * server and a different one in the browser, which React reports as a hydration
 * mismatch. When real timestamps arrive, relative times belong behind a
 * client-only boundary — see the note on `postedLabel` in `@snt/core`.
 */

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
