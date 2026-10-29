/**
 * Reports (docs/features/moderation.md, "Reporting"): the eight reasons a
 * person can report a listing or a person for, as the API stores them, with
 * the words shown for each. The most common comes first, as forms start on
 * the first choice.
 */

export type ReportReason =
  | 'not-as-described'
  | 'fake'
  | 'stolen'
  | 'duplicate'
  | 'wrong-category'
  | 'offensive'
  | 'no-show'
  | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  'not-as-described': 'Not as described',
  fake: 'Fake or misleading',
  stolen: 'Possibly stolen',
  duplicate: 'Duplicate listing',
  'wrong-category': 'Wrong category',
  offensive: 'Offensive',
  'no-show': 'Did not show up or backed out of a deal',
  other: 'Something else',
};

/** The reasons for a listing, in the order they are offered. */
export const LISTING_REPORT_REASONS: ReportReason[] = [
  'not-as-described',
  'fake',
  'stolen',
  'duplicate',
  'wrong-category',
  'offensive',
  'other',
];

/** The reasons for a person, from a deal check: a no show first. */
export const PERSON_REPORT_REASONS: ReportReason[] = ['no-show', 'not-as-described', 'fake', 'offensive', 'other'];

/** What staff can do about a report they find right. */
export type ReportAction = 'warning' | 'removal' | 'suspension' | 'ban';

export const REPORT_ACTION_LABELS: Record<ReportAction, string> = {
  warning: 'Warn them',
  removal: 'Remove the listing',
  suspension: 'Suspend for 7 days',
  ban: 'Ban the account',
};
