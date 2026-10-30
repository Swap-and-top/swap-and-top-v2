'use client';

/**
 * One list on a user's record, opened from its tile on their page: the
 * actions taken on them, reports about them, reports they sent, or their
 * listings, as a full table set as the rest of the Staff console's are.
 * "Back to" their page is in the toolbar. Read from the same record as
 * their page (`useUserRecord`), so it opens at once from there.
 */

import { REPORT_REASON_LABELS } from '@snt/core';
import { Badge, Bone, ButtonLink, Panel, Stack } from '@snt/ui';
import { ImageSmallIcon } from '@snt/ui/icons';
import type { ReactNode } from 'react';
import { QueryProblem } from '@/lib/query';
import { StaffPage } from '../../../StaffPage';
import styles from '../../page.module.css';
import record from '../record.module.css';
import {
  ACTION_PILL,
  LISTING_PILL,
  reportPill,
  Table,
  useUserRecord,
  type PersonRecord,
} from '../shared';

export type ListName = 'actions' | 'reports' | 'sent' | 'listings';

type Rows = { key: string; href?: string; cells: ReactNode[] }[];

/** Each list: its title, its table's headings and rows, and what it says
    when there is nothing. */
export const LISTS: Record<
  ListName,
  { title: string; heads: string[]; photo?: boolean; rows: (person: PersonRecord) => Rows }
> = {
  actions: {
    title: 'Actions taken',
    heads: ['When', 'What', 'Reason', 'By', 'Why'],
    rows: (person) =>
      person.actions.map((action, index) => ({
        key: String(index),
        cells: [
          action.dateLabel,
          <Badge key="pill" tone={ACTION_PILL[action.kind]?.tone ?? 'neutral'}>
            {`${ACTION_PILL[action.kind]?.label ?? action.kind}${action.reversed ? ', overturned' : ''}`}
          </Badge>,
          REPORT_REASON_LABELS[action.reason],
          `${action.byName}${action.fromReport ? ', from a report' : ''}`,
          action.note ?? '',
        ],
      })),
  },
  reports: {
    title: 'Reports about them',
    heads: ['When', 'Report', 'Listing', 'Outcome', 'Why'],
    rows: (person) =>
      person.reports.map((report) => ({
        key: report.id,
        href: `/staff/reports?open=${encodeURIComponent(report.id)}`,
        cells: [
          report.dateLabel,
          `${REPORT_REASON_LABELS[report.reason]}, ${report.label}`,
          report.listingTitle ?? 'About them, not a listing',
          <Badge key="pill" tone={reportPill(report).tone}>
            {reportPill(report).label}
          </Badge>,
          report.note ?? '',
        ],
      })),
  },
  sent: {
    title: 'Reports they sent',
    heads: ['When', 'Report', 'About', 'Outcome', 'Why'],
    rows: (person) =>
      person.reportsSent.map((report) => ({
        key: report.id,
        href: `/staff/reports?open=${encodeURIComponent(report.id)}`,
        cells: [
          report.dateLabel,
          `${REPORT_REASON_LABELS[report.reason]}, ${report.label}`,
          report.listingTitle ? `${report.personName}, ${report.listingTitle}` : (report.personName ?? ''),
          <Badge key="pill" tone={reportPill(report).tone}>
            {reportPill(report).label}
          </Badge>,
          report.note ?? '',
        ],
      })),
  },
  listings: {
    title: 'Listings',
    heads: ['', 'Listing', 'Posted', 'Status'],
    photo: true,
    rows: (person) =>
      person.listings.map((listing) => ({
        key: listing.slug,
        href: `/listing/${listing.slug}`,
        cells: [
          <span key="photo" className={record.photo} aria-hidden>
            {listing.photo ? (
              <img src={listing.photo} alt="" />
            ) : (
              <span className={record.noPhoto}>
                <ImageSmallIcon size={16} />
              </span>
            )}
          </span>,
          listing.title,
          listing.dateLabel,
          <Badge key="pill" tone={LISTING_PILL[listing.status]?.tone ?? 'neutral'}>
            {LISTING_PILL[listing.status]?.label ?? listing.status}
          </Badge>,
        ],
      })),
  },
};

export default function UserListPage({ id, list }: { id: string; list: ListName }) {
  const { allowed, query } = useUserRecord(id);
  const person = query.data;
  const view = LISTS[list];
  const rows = person ? view.rows(person) : null;

  return (
    <StaffPage
      title={view.title}
      meta={person ? `${person.name}, ${rows!.length} in all` : undefined}
      actions={
        <div className={record.toolbar}>
          <ButtonLink href={`/staff/users/${encodeURIComponent(id)}`} variant="secondary" size="sm">
            {person ? `Back to ${person.name}` : 'Back to the user'}
          </ButtonLink>
        </div>
      }
    >
      <Stack gap={6}>
        {allowed === false ? (
          <Panel padded>
            <p className={styles.lead}>Only Trust and safety can look up users.</p>
          </Panel>
        ) : query.isError ? (
          <QueryProblem error={query.error} onRetry={() => void query.refetch()} />
        ) : !rows ? (
          <Bone height={180} shape="block" />
        ) : (
          <Table heads={view.heads} rows={rows} empty="None yet." photo={view.photo} />
        )}
      </Stack>
    </StaffPage>
  );
}
