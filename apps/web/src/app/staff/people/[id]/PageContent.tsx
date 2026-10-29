'use client';

/**
 * One person's record, for Trust and safety (GET /api/staff/people/{id},
 * each look logged): who they are, their standing, stores, listings,
 * reports about them and the actions taken. "Take action" warns or
 * suspends them, or bans them for a lead (POST /api/staff/people/{id}/action),
 * where the API lets this person act on them; else it says why not.
 */

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
  REPORT_ACTION_LABELS,
  REPORT_REASON_LABELS,
  type ReportAction,
  type ReportReason,
} from '@snt/core';
import { Bone, Button, ButtonLink, Dropdown, Panel, Sheet, Stack } from '@snt/ui';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../../sections';
import { StaffPage } from '../../StaffPage';
import { STANDING_LABEL } from '../standing';
import styles from '../page.module.css';

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
  listings: { title: string; slug: string; status: string; dateLabel: string }[];
  reports: { reason: ReportReason; state: string; dateLabel: string; listingTitle?: string }[];
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

const ACTION_DONE: Record<ReportAction, string> = {
  warning: 'Warned',
  removal: 'Listing removed',
  suspension: 'Suspended',
  ban: 'Banned',
};

const REPORT_STATE: Record<string, string> = {
  open: 'Open',
  claimed: 'Being looked at',
  approved: 'Upheld',
  cleared: 'Cleared',
};

const ALL_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

export default function PersonPage({ id }: { id: string }) {
  const allowed = useInDepartment('trust_safety');
  const [acting, setActing] = useState(false);
  const record = useQuery({
    queryKey: staffKeys.person(id),
    queryFn: () => apiGet<PersonRecord>(`/staff/people/${encodeURIComponent(id)}`),
    enabled: allowed === true,
  });
  const person = record.data;

  const standing = person
    ? `${STANDING_LABEL[person.standing] ?? person.standing}${person.suspendedUntilLabel ? ` until ${person.suspendedUntilLabel}` : ''}`
    : '';

  return (
    <StaffPage title={person?.name ?? ''} meta={person ? standing : undefined}>
      <Stack gap={6}>
        {allowed === false ? (
          <Panel padded>
            <p className={styles.lead}>Only Trust and safety can look up people.</p>
          </Panel>
        ) : record.isError ? (
          <QueryProblem error={record.error} onRetry={() => void record.refetch()} />
        ) : !person ? (
          <Panel padded>
            <Stack gap={5}>
              <Bone width={160} height={22} />
              <Bone height={90} />
              <Bone shape="pill" height={44} />
            </Stack>
          </Panel>
        ) : (
          <>
            <Panel padded>
              <Stack gap={5}>
                <dl className={styles.facts}>
                  <dt>Phone</dt>
                  <dd>
                    {person.phone ? (
                      <a href={`tel:+263${person.phone.replace(/\D/g, '').slice(1)}`}>{person.phone}</a>
                    ) : (
                      'None given'
                    )}
                  </dd>
                  <dt>Area</dt>
                  <dd>{person.location || 'Not given'}</dd>
                  <dt>Joined</dt>
                  <dd>{person.joinedLabel}</dd>
                  {person.lastSeenLabel ? (
                    <>
                      <dt>Last seen</dt>
                      <dd>{person.lastSeenLabel}</dd>
                    </>
                  ) : null}
                  <dt>Standing</dt>
                  <dd>{standing}</dd>
                  {person.teamLabel ? (
                    <>
                      <dt>Our team</dt>
                      <dd>{person.teamLabel}</dd>
                    </>
                  ) : null}
                  <dt>Deals</dt>
                  <dd>{person.confirmedDeals} confirmed</dd>
                  <dt>Listings</dt>
                  <dd>
                    {person.liveListings} live
                    {person.liveListings && (person.standing === 'suspended' || person.standing === 'banned')
                      ? ', hidden from buyers for now'
                      : ''}
                  </dd>
                  {person.stores.length ? (
                    <>
                      <dt>Stores</dt>
                      <dd>
                        {person.stores
                          .map((store) => `${store.name} (${store.role === 'owner' ? 'owner' : 'staff'})`)
                          .join(', ')}
                      </dd>
                    </>
                  ) : null}
                </dl>
                {person.cannotAct ? (
                  <p className={styles.lead}>{person.cannotAct}</p>
                ) : (
                  <Button block onClick={() => setActing(true)}>
                    Take action
                  </Button>
                )}
                <ButtonLink href="/staff/people" variant="secondary" block>
                  Back to People
                </ButtonLink>
              </Stack>
            </Panel>

            <Panel padded>
              <Stack gap={4}>
                <h2 className={styles.heading}>Actions taken</h2>
                {person.actions.length === 0 ? (
                  <p className={styles.lead}>None.</p>
                ) : (
                  <ul className={styles.list}>
                    {person.actions.map((action, index) => (
                      <li key={index}>
                        <span>
                          <strong>{ACTION_DONE[action.kind]}</strong>, {REPORT_REASON_LABELS[action.reason].toLowerCase()}
                          {action.reversed ? ' (overturned)' : ''}
                        </span>
                        <span className={styles.muted}>
                          {action.dateLabel} by {action.byName}
                          {action.fromReport ? ', from a report' : ''}
                          {action.note ? `. ${action.note}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Stack>
            </Panel>

            <Panel padded>
              <Stack gap={4}>
                <h2 className={styles.heading}>Reports about them</h2>
                {person.reports.length === 0 ? (
                  <p className={styles.lead}>None.</p>
                ) : (
                  <ul className={styles.list}>
                    {person.reports.map((report, index) => (
                      <li key={index}>
                        <span>
                          <strong>{REPORT_REASON_LABELS[report.reason]}</strong>
                          {report.listingTitle ? `, on ${report.listingTitle}` : ''}
                        </span>
                        <span className={styles.muted}>
                          {report.dateLabel}, {REPORT_STATE[report.state] ?? report.state}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Stack>
            </Panel>

            <Panel padded>
              <Stack gap={4}>
                <h2 className={styles.heading}>Listings</h2>
                {person.listings.length === 0 ? (
                  <p className={styles.lead}>None.</p>
                ) : (
                  <ul className={styles.list}>
                    {person.listings.map((listing) => (
                      <li key={listing.slug}>
                        <Link href={`/listing/${listing.slug}`}>{listing.title}</Link>
                        <span className={styles.muted}>
                          {listing.dateLabel}, {listing.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Stack>
            </Panel>
          </>
        )}
        {acting && person ? (
          <ActionSheet person={person} onClose={() => setActing(false)} onDone={() => setActing(false)} />
        ) : null}
      </Stack>
    </StaffPage>
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
      apiSend(`/staff/people/${encodeURIComponent(person.id)}/action`, 'POST', {
        kind,
        reason,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(`${person.name} has been told.`);
      // Their record, and the log, read again with the action on them.
      void queryClient.invalidateQueries({ queryKey: staffKeys.person(person.id) });
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
          <span className={styles.label}>Note for the record (optional)</span>
          <textarea
            className={styles.textarea}
            rows={2}
            maxLength={500}
            placeholder="e.g. Several buyers said the same on the phone."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <p className={styles.lead}>{person.name} is told what was decided and why.</p>
        <Button size="lg" block loading={save.isPending} onClick={() => save.mutate()}>
          {REPORT_ACTION_LABELS[kind]}
        </Button>
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}
