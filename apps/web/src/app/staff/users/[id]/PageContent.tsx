'use client';

/**
 * One person's record, for Trust and safety (GET /api/staff/users/{id},
 * each look logged), set as the rest of the Staff console is: their name
 * with their standing pill, and Take action and Back to Users in the
 * toolbar; who they are in two columns; then small tables, as the Activity
 * log's, of the actions taken on them, reports about them, reports they
 * sent and their listings, each decision with its note. A report opens on
 * Reports, a listing on its page. "Take action" warns or suspends them, or
 * bans them for a lead (POST /api/staff/users/{id}/action), where the API
 * lets this person act on them (never on a banned account: only an
 * overturned appeal lifts a ban); else it says why not.
 */

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  REPORT_ACTION_LABELS,
  REPORT_REASON_LABELS,
  type ReportAction,
  type ReportReason,
} from '@snt/core';
import { Badge, Bone, Button, ButtonLink, Dropdown, Panel, Sheet, Stack, type BadgeTone } from '@snt/ui';
import { ImageSmallIcon } from '@snt/ui/icons';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../../sections';
import { StaffPage } from '../../StaffPage';
import { STANDING_LABEL, STANDING_TONE } from '../standing';
import styles from '../page.module.css';
import record from './record.module.css';

/** A report on the record: about them, or sent by them. */
interface ReportLine {
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

interface PersonRecord {
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

type Kind = 'warning' | 'suspension' | 'ban';

/** What was done, as a pill. */
const ACTION_PILL: Record<string, { label: string; tone: BadgeTone }> = {
  warning: { label: 'Warned', tone: 'warning' },
  removal: { label: 'Listing removed', tone: 'warning' },
  suspension: { label: 'Suspended', tone: 'danger' },
  ban: { label: 'Banned', tone: 'dark' },
  none: { label: 'Cleared', tone: 'neutral' },
};

/** Where a report stands, as a pill: open, being looked at, or what was decided. */
function reportPill(report: ReportLine): { label: string; tone: BadgeTone } {
  if (report.state === 'open') return { label: 'Open', tone: 'accent' };
  if (report.state === 'claimed') return { label: 'Being looked at', tone: 'neutral' };
  const pill = ACTION_PILL[report.kind ?? (report.state === 'cleared' ? 'none' : 'warning')] ?? ACTION_PILL.none!;
  return report.reversed ? { ...pill, label: `${pill.label}, overturned` } : pill;
}

/** A listing's state, as a pill. */
const LISTING_PILL: Record<string, { label: string; tone: BadgeTone }> = {
  live: { label: 'Live', tone: 'success' },
  draft: { label: 'Draft', tone: 'neutral' },
  paused: { label: 'Paused', tone: 'warning' },
  sold: { label: 'Sold', tone: 'neutral' },
  removed: { label: 'Removed', tone: 'danger' },
  withdrawn: { label: 'Deleted', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
};

const ALL_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

export default function PersonPage({ id }: { id: string }) {
  const allowed = useInDepartment('trust_safety');
  const [acting, setActing] = useState(false);
  const query = useQuery({
    queryKey: staffKeys.user(id),
    queryFn: () => apiGet<PersonRecord>(`/staff/users/${encodeURIComponent(id)}`),
    enabled: allowed === true,
  });
  const person = query.data;
  const standing = person
    ? `${STANDING_LABEL[person.standing] ?? person.standing}${person.suspendedUntilLabel ? ` until ${person.suspendedUntilLabel}` : ''}`
    : '';

  return (
    <StaffPage
      title={person?.name ?? ''}
      meta={
        person ? (
          <span className={record.meta}>
            <Badge tone={STANDING_TONE[person.standing] ?? 'neutral'}>{standing}</Badge>
            {person.teamLabel ? <Badge tone="accent">{person.teamLabel}</Badge> : null}
          </span>
        ) : undefined
      }
      actions={
        person ? (
          <div className={record.toolbar}>
            {person.cannotAct ? null : (
              <Button size="sm" onClick={() => setActing(true)}>
                Take action
              </Button>
            )}
            <ButtonLink href="/staff/users" variant="secondary" size="sm">
              Back to Users
            </ButtonLink>
            {person.cannotAct ? <p className={record.why}>{person.cannotAct}</p> : null}
          </div>
        ) : null
      }
    >
      <Stack gap={6}>
        {allowed === false ? (
          <Panel padded>
            <p className={styles.lead}>Only Trust and safety can look up users.</p>
          </Panel>
        ) : query.isError ? (
          <QueryProblem error={query.error} onRetry={() => void query.refetch()} />
        ) : !person ? (
          <>
            <Panel padded>
              <div className={record.facts}>
                {Array.from({ length: 8 }, (_, n) => (
                  <Bone key={n} width="70%" height={14} />
                ))}
              </div>
            </Panel>
            <Bone height={140} shape="block" />
          </>
        ) : (
          <>
            {/* Who they are, in two columns on a laptop. */}
            <Panel padded>
              <dl className={record.facts}>
                <Fact label="Phone">
                  {person.phone ? (
                    <a href={`tel:+263${person.phone.replace(/\D/g, '').slice(1)}`}>{person.phone}</a>
                  ) : (
                    'None given'
                  )}
                </Fact>
                <Fact label="Area">{person.location || 'Not given'}</Fact>
                <Fact label="Joined">{person.joinedLabel}</Fact>
                <Fact label="Last seen">{person.lastSeenLabel ?? 'Not yet'}</Fact>
                <Fact label="Deals">{person.confirmedDeals} confirmed</Fact>
                <Fact label="Listings">
                  {person.liveListings} live
                  {person.liveListings && (person.standing === 'suspended' || person.standing === 'banned')
                    ? ', hidden from buyers for now'
                    : ''}
                </Fact>
                <Fact label="Stores">
                  {person.stores.length
                    ? person.stores.map((store, index) => (
                        <span key={store.slug}>
                          {index ? ', ' : ''}
                          <Link href={`/store/${store.slug}`} className={record.link}>
                            {store.name}
                          </Link>{' '}
                          ({store.role === 'owner' ? 'owner' : 'staff'})
                        </span>
                      ))
                    : 'None'}
                </Fact>
                <Fact label="Reports">
                  {person.reports.length} about them, {person.reportsSent.length} sent
                </Fact>
              </dl>
            </Panel>

            <Table
              title="Actions taken"
              empty="None."
              heads={['When', 'What', 'Reason', 'By', 'Why']}
              rows={person.actions.map((action, index) => ({
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
              }))}
            />

            <Table
              title="Reports about them"
              empty="None."
              heads={['When', 'Report', 'Listing', 'Outcome', 'Why']}
              rows={person.reports.map((report) => ({
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
              }))}
            />

            <Table
              title="Reports they sent"
              empty="None."
              heads={['When', 'Report', 'About', 'Outcome', 'Why']}
              rows={person.reportsSent.map((report) => ({
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
              }))}
            />

            <Table
              title="Listings"
              empty="None."
              photo
              heads={['', 'Listing', 'Posted', 'Status']}
              rows={person.listings.map((listing) => ({
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
              }))}
            />
          </>
        )}
        {acting && person ? (
          <ActionSheet person={person} onClose={() => setActing(false)} onDone={() => setActing(false)} />
        ) : null}
      </Stack>
    </StaffPage>
  );
}

/** One fact: its label over it on a phone, beside it on a laptop. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={record.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * A small table, set as the Activity log's: a title, then one white card
 * under the pale blue strip of headings, one line a row. A row with `href`
 * opens it. On a phone the headings go and each row's cells run on.
 */
function Table({
  title,
  heads,
  rows,
  empty,
  photo = false,
}: {
  title: string;
  heads: string[];
  rows: { key: string; href?: string; cells: ReactNode[] }[];
  empty: string;
  /** The first column is a listing's photo. */
  photo?: boolean;
}) {
  const kind = photo ? record.listingsTable : record.reportsTable;
  return (
    <section className={record.section}>
      <h2 className={record.title}>{title}</h2>
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

/** Take action: what to do, starting on a warning, and the reason. */
function ActionSheet({
  person,
  onClose,
  onDone,
}: {
  person: PersonRecord;
  onClose: () => void;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<Kind>('warning');
  const [reason, setReason] = useState<ReportReason>(ALL_REASONS[0]!);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();
  const kindLabel = useId();
  const reasonLabel = useId();
  const kinds = (['warning', 'suspension', 'ban'] as const).filter((value) => value !== 'ban' || person.canBan);

  const save = useMutation({
    mutationFn: () =>
      apiSend(`/staff/users/${encodeURIComponent(person.id)}/action`, 'POST', {
        kind,
        reason,
        note: note.trim(),
      }),
    onSuccess: () => {
      toast.success(`${person.name} has been told.`);
      // Their record, and the log, read again with the action on them.
      void queryClient.invalidateQueries({ queryKey: staffKeys.user(person.id) });
      void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
      onDone();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Sheet narrow title={`Take action on ${person.name}`} onClose={onClose}>
      <Stack gap={5}>
        <div className={styles.field}>
          <span id={kindLabel} className={styles.label}>
            What to do
          </span>
          <Dropdown
            value={kind}
            options={kinds.map((value) => ({ value, label: REPORT_ACTION_LABELS[value] }))}
            onChange={setKind}
            labelledBy={kindLabel}
          />
        </div>
        <div className={styles.field}>
          <span id={reasonLabel} className={styles.label}>
            Reason
          </span>
          <Dropdown
            value={reason}
            options={ALL_REASONS.map((value) => ({ value, label: REPORT_REASON_LABELS[value] }))}
            onChange={setReason}
            labelledBy={reasonLabel}
          />
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Why you decided this</span>
          <textarea
            className={styles.textarea}
            rows={3}
            maxLength={500}
            placeholder="e.g. Several buyers said the same on the phone."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <p className={styles.lead}>{person.name} is told what was decided and why.</p>
        {/* A note saying why is required: off until there is one. */}
        <Button
          size="lg"
          block
          loading={save.isPending}
          disabled={note.trim().length < 2}
          onClick={() => save.mutate()}
        >
          {REPORT_ACTION_LABELS[kind]}
        </Button>
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}
