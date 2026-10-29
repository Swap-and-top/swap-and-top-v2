'use client';

/**
 * Reports, a section of the Staff console, for Trust and safety: the open
 * reports this person may handle, oldest first (GET /api/staff/reports).
 * Claim one, so nobody else works on it, then Approve it with an action,
 * under its reason or a corrected one, or Clear it
 * (POST /api/staff/reports/{id}/claim and /decide). The API decides who may
 * handle what: never your own report, one about you or your store, and
 * reports about our team go to leads.
 */

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
import { refreshListing } from '@/lib/refresh';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import styles from './page.module.css';

interface QueueItem {
  id: string;
  label: string;
  reason: ReportReason;
  details?: string;
  agoLabel: string;
  listing?: { title: string; slug: string; status: string };
  person: { id: string; name: string; standing: string; upheldBefore: number; otherOpen: number };
  reporterName: string;
  claimedBy?: string;
  mine: boolean;
  suggested: ReportAction;
}

const STANDING_LABEL: Record<string, string> = {
  good: 'Good standing',
  warned: 'Warned before',
  limited: 'Limited',
  suspended: 'Suspended',
  banned: 'Banned',
};

const ALL_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

/** "2 upheld before, 1 more open", or nothing to say. */
function recordLine(person: QueueItem['person']): string {
  const parts = [STANDING_LABEL[person.standing] ?? person.standing];
  if (person.upheldBefore) parts.push(`${person.upheldBefore} upheld before`);
  if (person.otherOpen) parts.push(`${person.otherOpen} more open`);
  return parts.join(', ');
}

export default function ReportsPage() {
  const allowed = useInDepartment('trust_safety');
  const lead = useInDepartment('trust_safety', true) === true;
  /** The report being approved, while its action is chosen. */
  const [approving, setApproving] = useState<QueueItem | null>(null);
  const queryClient = useQueryClient();
  const queue = useQuery({
    queryKey: staffKeys.reports,
    queryFn: () => apiGet<{ reports: QueueItem[] }>('/staff/reports').then((data) => data.reports),
    enabled: allowed === true,
  });
  const reports = queue.data;

  /** The queue as it now stands, changed here before it is read again. */
  const setReports = (change: (list: QueueItem[]) => QueueItem[]) =>
    queryClient.setQueryData<QueueItem[]>(staffKeys.reports, (list) => (list ? change(list) : list));
  /** What a claim or a decision changes elsewhere: the counts and the log. */
  const refreshAround = () => {
    void queryClient.invalidateQueries({ queryKey: staffKeys.counts });
    void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
  };

  const claim = useMutation({
    mutationFn: (report: QueueItem) => apiSend(`/staff/reports/${encodeURIComponent(report.id)}/claim`, 'POST'),
    onSuccess: (_, report) => {
      setReports((list) => list.map((item) => (item.id === report.id ? { ...item, mine: true, claimedBy: 'You' } : item)));
      refreshAround();
    },
    onError: (error) => {
      toast.error(error.message);
      // Someone else may have it now: read the queue again.
      void queryClient.invalidateQueries({ queryKey: staffKeys.reports });
    },
  });

  const decide = useMutation({
    mutationFn: ({
      report,
      body,
    }: {
      report: QueueItem;
      body: { decision: 'approve' | 'clear'; action?: ReportAction; reason?: ReportReason; note?: string };
    }) => apiSend(`/staff/reports/${encodeURIComponent(report.id)}/decide`, 'POST', body),
    onSuccess: (_, { report, body }) => {
      // A removed listing comes down at once, not when its minute is up;
      // not waited for, as rebuilding the page can take a few seconds.
      if (report.listing && (body.action === 'removal' || body.action === 'ban')) void refreshListing(report.listing.slug);
      setReports((list) => list.filter((item) => item.id !== report.id));
      setApproving(null);
      refreshAround();
      toast.success(
        body.decision === 'clear'
          ? `${report.label} cleared. Nothing happens to ${report.person.name.replace(/\.$/, '')}.`
          : `${report.label} approved. ${report.person.name} has been told.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  /** The report being claimed or decided, so its buttons wait. */
  const busy = claim.isPending ? claim.variables?.id : decide.isPending ? decide.variables?.report.id : null;

  return (
    <StaffPage title="Reports" meta="Reports from people, oldest first">
      <Stack gap={6}>
        {allowed === false ? (
          <Panel padded>
            <p className={styles.lead}>Only Trust and safety can handle reports.</p>
          </Panel>
        ) : queue.isError ? (
          <QueryProblem error={queue.error} onRetry={() => void queue.refetch()} />
        ) : !reports ? (
          // Loading: a card's shape, so the page does not sit empty.
          <Panel padded>
            <Stack gap={5}>
              <Bone width={180} height={22} />
              <Bone width={120} height={14} />
              <Bone height={70} />
              <Bone shape="pill" height={44} />
            </Stack>
          </Panel>
        ) : reports.length === 0 ? (
          <Panel padded>
            <p className={styles.lead}>No reports are waiting.</p>
          </Panel>
        ) : (
          reports.map((report) => (
            <Panel padded key={report.id}>
              <Stack gap={5}>
                <div className={styles.head}>
                  <h2 className={styles.reason}>{REPORT_REASON_LABELS[report.reason]}</h2>
                  <span className={styles.meta}>
                    {report.label} · {report.agoLabel}
                  </span>
                </div>
                <dl className={styles.facts}>
                  {report.listing ? (
                    <>
                      <dt>Listing</dt>
                      <dd>
                        {report.listing.title}
                        {report.listing.status !== 'live' ? ` (${report.listing.status})` : ''}
                      </dd>
                    </>
                  ) : null}
                  <dt>{report.listing ? 'Posted by' : 'Person'}</dt>
                  <dd>{report.person.name}</dd>
                  <dt>Record</dt>
                  <dd>{recordLine(report.person)}</dd>
                  <dt>Reported by</dt>
                  <dd>{report.reporterName}</dd>
                  {report.details ? (
                    <>
                      <dt>Their words</dt>
                      <dd>{report.details}</dd>
                    </>
                  ) : null}
                </dl>
                {report.listing ? (
                  <ButtonLink href={`/listing/${report.listing.slug}`} variant="secondary" block>
                    View this listing
                  </ButtonLink>
                ) : null}
                {report.mine ? (
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      disabled={busy === report.id}
                      onClick={() => decide.mutate({ report, body: { decision: 'clear' } })}
                    >
                      Clear
                    </Button>
                    <Button disabled={busy === report.id} onClick={() => setApproving(report)}>
                      Approve
                    </Button>
                  </div>
                ) : report.claimedBy ? (
                  <p className={styles.lead}>{report.claimedBy} is working on this report.</p>
                ) : (
                  <Button block loading={busy === report.id} onClick={() => claim.mutate(report)}>
                    Claim
                  </Button>
                )}
              </Stack>
            </Panel>
          ))
        )}
        {approving ? (
          <ApproveSheet
            report={approving}
            lead={lead}
            busy={busy === approving.id}
            onClose={() => setApproving(null)}
            onApprove={(action, reason, note) =>
              decide.mutate({ report: approving, body: { decision: 'approve', action, reason, note } })
            }
          />
        ) : null}
      </Stack>
    </StaffPage>
  );
}

/** Approving: the action, starting on the suggested one, and the reason,
    starting on the report's own, to correct it if it was filed wrong. */
function ApproveSheet({
  report,
  lead,
  busy,
  onClose,
  onApprove,
}: {
  report: QueueItem;
  lead: boolean;
  busy: boolean;
  onClose: () => void;
  onApprove: (action: ReportAction, reason: ReportReason, note?: string) => void;
}) {
  const [action, setAction] = useState<ReportAction>(report.suggested);
  const [reason, setReason] = useState<ReportReason>(report.reason);
  const [note, setNote] = useState('');
  const actionLabel = useId();
  const reasonLabel = useId();
  const actions = (['warning', 'removal', 'suspension', 'ban'] as const).filter(
    (kind) => (kind !== 'removal' || report.listing) && (kind !== 'ban' || lead),
  );

  return (
    <Sheet narrow title={`Approve ${report.label}`} onClose={onClose}>
      <Stack gap={5}>
        <div className={styles.field}>
          <span id={actionLabel} className={styles.label}>
            What to do
          </span>
          <Dropdown
            value={action}
            options={actions.map((value) => ({
              value,
              label: REPORT_ACTION_LABELS[value],
              note: value === report.suggested ? 'Suggested' : undefined,
            }))}
            onChange={setAction}
            labelledBy={actionLabel}
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
            placeholder="e.g. Same photos as another seller's listing."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <p className={styles.lead}>
          {report.person.name} is told what was decided, never who reported them.
        </p>
        <Button size="lg" block loading={busy} onClick={() => onApprove(action, reason, note.trim() || undefined)}>
          Approve
        </Button>
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}
