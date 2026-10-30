'use client';

/**
 * What a user's record page and its lists share (GET /api/staff/users/{id},
 * read once and kept by TanStack Query, so a list opens at once): the
 * record's shape, the pills for actions, reports and listings, the query,
 * and the small table set as the Activity log's.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ReportAction, ReportReason } from '@snt/core';
import type { BadgeTone } from '@snt/ui';
import { apiGet } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../../sections';
import record from './record.module.css';

/** A report on the record: about them, or sent by them. */
export interface ReportLine {
  id: string;
  label: string;
  reason: ReportReason;
  state: string;
  kind?: string;
  dateLabel: string;
  listingTitle?: string;
  personName?: string;
  note?: string;
  reversed: boolean;
}

export interface PersonRecord {
  id: string;
  name: string;
  phone?: string;
  location?: string;
  joinedLabel: string;
  lastSeenLabel?: string;
  standing: string;
  suspendedUntilLabel?: string;
  teamLabel?: string;
  stores: { name: string; slug: string; role: string }[];
  confirmedDeals: number;
  liveListings: number;
  listings: { title: string; slug: string; status: string; dateLabel: string; photo?: string }[];
  reports: ReportLine[];
  reportsSent: ReportLine[];
  actions: {
    kind: ReportAction;
    reason: ReportReason;
    note?: string;
    byName: string;
    dateLabel: string;
    reversed: boolean;
    fromReport: boolean;
  }[];
  cannotAct?: string;
  canBan: boolean;
}

export type Kind = 'warning' | 'suspension' | 'ban';

/** What was done, as a pill. */
export const ACTION_PILL: Record<string, { label: string; tone: BadgeTone }> = {
  warning: { label: 'Warned', tone: 'warning' },
  removal: { label: 'Listing removed', tone: 'warning' },
  suspension: { label: 'Suspended', tone: 'danger' },
  ban: { label: 'Banned', tone: 'dark' },
  none: { label: 'Cleared', tone: 'neutral' },
};

/** Where a report stands, as a pill: open, being looked at, or what was decided. */
export function reportPill(report: ReportLine): { label: string; tone: BadgeTone } {
  if (report.state === 'open') return { label: 'Open', tone: 'accent' };
  if (report.state === 'claimed') return { label: 'Being looked at', tone: 'neutral' };
  const pill = ACTION_PILL[report.kind ?? (report.state === 'cleared' ? 'none' : 'warning')] ?? ACTION_PILL.none!;
  return report.reversed ? { ...pill, label: `${pill.label}, overturned` } : pill;
}

/** A listing's state, as a pill. */
export const LISTING_PILL: Record<string, { label: string; tone: BadgeTone }> = {
  live: { label: 'Live', tone: 'success' },
  draft: { label: 'Draft', tone: 'neutral' },
  paused: { label: 'Paused', tone: 'warning' },
  sold: { label: 'Sold', tone: 'neutral' },
  removed: { label: 'Removed', tone: 'danger' },
  withdrawn: { label: 'Deleted', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
};

/** The record, for the Trust and safety team only. */
export function useUserRecord(id: string) {
  const allowed = useInDepartment('trust_safety');
  const query = useQuery({
    queryKey: staffKeys.user(id),
    queryFn: () => apiGet<PersonRecord>(`/staff/users/${encodeURIComponent(id)}`),
    enabled: allowed === true,
  });
  return { allowed, query };
}

/**
 * A small table, set as the Activity log's: a title, then one white card
 * under the pale blue strip of headings, one line a row. A row with `href`
 * opens it. On a phone the headings go and each row's cells run on.
 */
export function Table({
  title,
  heads,
  rows,
  empty,
  photo = false,
}: {
  /** Over the table; none where the page's own title says it. */
  title?: string;
  heads: string[];
  rows: { key: string; href?: string; cells: ReactNode[] }[];
  empty: string;
  /** The first column is a listing's photo. */
  photo?: boolean;
}) {
  const kind = photo ? record.listingsTable : record.reportsTable;
  return (
    <section className={record.section}>
      {title ? <h2 className={record.title}>{title}</h2> : null}
      <div className={[record.table, kind].join(' ')}>
        <div className={record.headerRow} aria-hidden>
          {heads.map((head, index) => (
            <span key={index}>{head}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className={record.empty}>{empty}</p>
        ) : (
          rows.map((row) => {
            const cells = row.cells.map((cell, index) => (
              <span key={index} className={record.cell} title={typeof cell === 'string' ? cell : undefined}>
                {cell}
              </span>
            ));
            return row.href ? (
              <Link key={row.key} href={row.href} className={[record.row, record.opens].join(' ')}>
                {cells}
              </Link>
            ) : (
              <div key={row.key} className={record.row}>
                {cells}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
