'use client';

/**
 * Reports, a section of the Staff console, for Trust and safety
 * (GET /api/staff/reports): every report this person may handle, whatever
 * became of it, as a table set as the Activity log's is; on a phone each
 * row is one short line, as an email in a mail app: the photo, the reason
 * and number, the listing, and Claim or what became of it. Open ones (nobody has them) read as unread, bold
 * with a blue dot and a Claim button; the waiting ones come first, oldest
 * first, then the decided ones, newest first. The filter narrows it to open,
 * claimed, one outcome (warned, listing removed, suspended, banned) or
 * cleared, each with its count. A row opens the full report: Claim it, so
 * nobody else works on it, then Approve it with an action, under its reason
 * or a corrected one, or Clear it (POST /api/staff/reports/{id}/claim and
 * /decide). The API decides who may handle what: never your own report, one
 * about you or your store, and reports about our team go to leads.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
  REPORT_ACTION_LABELS,
  REPORT_REASON_LABELS,
  type ReportAction,
  type ReportReason,
} from '@snt/core';
import { Badge, Bone, Button, ButtonLink, Dropdown, Panel, Sheet, Stack, type BadgeTone } from '@snt/ui';
import { ImageSmallIcon } from '@snt/ui/icons';
import { refreshListing } from '@/lib/refresh';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import styles from './page.module.css';

type Show = 'all' | 'open' | 'claimed' | 'warning' | 'removal' | 'suspension' | 'ban' | 'cleared';

interface Row {
  id: string;
  label: string;
  reason: ReportReason;
  details?: string;
  agoLabel: string;
  show: Exclude<Show, 'all'>;
  listing?: { title: string; slug: string; status: string; photo?: string };
  person: { id: string; name: string; standing: string; upheldBefore: number; otherOpen: number };
  reporterName: string;
  claimedBy?: string;
  mine: boolean;
  suggested: ReportAction;
  outcome?: { kind: 'none' | ReportAction; by: string; agoLabel: string; reversed: boolean; note?: string };
}

/** The filter's choices, in its order. */
const SHOW_LABELS: Record<Show, string> = {
  all: 'All reports',
  open: 'Open',
  claimed: 'Claimed',
  warning: 'Warned',
  removal: 'Listing removed',
  suspension: 'Suspended',
  ban: 'Banned',
  cleared: 'Cleared',
};

/** How serious a reason is, at a glance: red, amber or grey. */
function reasonTone(reason: ReportReason): BadgeTone {
  if (reason === 'stolen') return 'danger';
  if (reason === 'fake' || reason === 'not-as-described' || reason === 'offensive' || reason === 'no-show') {
    return 'warning';
  }
  return 'neutral';
}

/** What became of it, as a pill. */
const OUTCOME: Record<Exclude<Show, 'all' | 'open' | 'claimed'>, { label: string; tone: BadgeTone }> = {
  warning: { label: 'Warned', tone: 'warning' },
  removal: { label: 'Listing removed', tone: 'warning' },
  suspension: { label: 'Suspended', tone: 'danger' },
  ban: { label: 'Banned', tone: 'danger' },
  cleared: { label: 'Cleared', tone: 'neutral' },
};

const STANDING_LABEL: Record<string, string> = {
  good: 'Good standing',
  warned: 'Warned before',
  limited: 'Limited',
  suspended: 'Suspended',
  banned: 'Banned',
};

const ALL_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

/** "Banned, 1 upheld before, 2 more open". */
function recordLine(person: Row['person']): string {
  const parts = [STANDING_LABEL[person.standing] ?? person.standing];
  if (person.upheldBefore) parts.push(`${person.upheldBefore} upheld before`);
  if (person.otherOpen) parts.push(`${person.otherOpen} more open`);
  return parts.join(', ');
}

/** The listing's title, with how it stands when it is not live. */
const listingLine = (listing: NonNullable<Row['listing']>) =>
  listing.status !== 'live' ? `${listing.title} (${listing.status})` : listing.title;

export default function ReportsPage() {
  const allowed = useInDepartment('trust_safety');
  const lead = useInDepartment('trust_safety', true) === true;
  const showLabel = useId();
  const [show, setShow] = useState<Show>('all');
  /** The report open in its sheet, by id, so it follows the list. */
  const [openId, setOpenId] = useState<string | null>(null);
  /** The report being approved or cleared, while its note is written. */
  const [deciding, setDeciding] = useState<{ report: Row; decision: 'approve' | 'clear' } | null>(null);
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...staffKeys.reports, show],
    queryFn: () => apiGet<{ reports: Row[]; counts: Record<Show, number> }>(`/staff/reports?show=${show}`),
    enabled: allowed === true,
    // The rows on show stay while another filter loads.
    placeholderData: keepPreviousData,
  });
  const reports = list.data?.reports ?? null;
  const counts = list.data?.counts;
  const opened = reports?.find((report) => report.id === openId) ?? null;

  /** After a claim or a decision: every filter of the list, the counts and
      the log are read again. */
  const refreshAround = () => {
    void queryClient.invalidateQueries({ queryKey: staffKeys.reports });
    void queryClient.invalidateQueries({ queryKey: staffKeys.counts });
    void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
  };

  const claim = useMutation({
    mutationFn: (report: Row) => apiSend(`/staff/reports/${encodeURIComponent(report.id)}/claim`, 'POST'),
    onSuccess: (_, report) => {
      // Theirs now: the report opens, to decide it.
      queryClient.setQueryData<{ reports: Row[]; counts: Record<Show, number> }>(
        [...staffKeys.reports, show],
        (data) =>
          data && {
            ...data,
            reports: data.reports.map((item) =>
              item.id === report.id ? { ...item, mine: true, claimedBy: 'You', show: 'claimed' } : item,
            ),
          },
      );
      setOpenId(report.id);
      refreshAround();
    },
    onError: (error) => {
      toast.error(error.message);
      // Someone else may have it now: read the list again.
      void queryClient.invalidateQueries({ queryKey: staffKeys.reports });
    },
  });

  const decide = useMutation({
    mutationFn: ({
      report,
      body,
    }: {
      report: Row;
      body: { decision: 'approve' | 'clear'; action?: ReportAction; reason?: ReportReason; note: string };
    }) => apiSend(`/staff/reports/${encodeURIComponent(report.id)}/decide`, 'POST', body),
    onSuccess: (_, { report, body }) => {
      // A removed listing comes down at once, not when its minute is up;
      // not waited for, as rebuilding the page can take a few seconds.
      if (report.listing && (body.action === 'removal' || body.action === 'ban')) void refreshListing(report.listing.slug);
      setDeciding(null);
      setOpenId(null);
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

  /** Where a row stands, at its end: Claim while open, who has it, or what
      became of it. */
  const status = (report: Row) => {
    if (report.show === 'open') {
      // Small, the size of the Activity log's page buttons.
      return (
        <button
          type="button"
          className={styles.claim}
          disabled={busy === report.id}
          aria-busy={busy === report.id || undefined}
          onClick={(event) => {
            event.stopPropagation();
            claim.mutate(report);
          }}
        >
          {busy === report.id ? 'Claiming' : 'Claim'}
        </button>
      );
    }
    if (report.show === 'claimed') {
      return report.mine ? <Badge tone="accent">Yours</Badge> : <Badge tone="neutral">{`With ${report.claimedBy}`}</Badge>;
    }
    const outcome = OUTCOME[report.show];
    return <Badge tone={outcome.tone}>{report.outcome?.reversed ? `${outcome.label}, reversed` : outcome.label}</Badge>;
  };

  return (
    <StaffPage
      title="Reports"
      meta="Every report, the ones waiting first"
      actions={
        allowed ? (
          <div className={styles.toolbar}>
            <span id={showLabel} hidden>
              Show
            </span>
            <Dropdown<Show>
              value={show}
              options={(Object.keys(SHOW_LABELS) as Show[]).map((value) => ({
                value,
                label: SHOW_LABELS[value],
                count: counts?.[value],
              }))}
              onChange={setShow}
              labelledBy={showLabel}
              className={styles.filter}
            />
          </div>
        ) : null
      }
    >
      {allowed === false ? (
        <Panel padded>
          <p className={styles.lead}>Only Trust and safety can handle reports.</p>
        </Panel>
      ) : list.isError && !list.data ? (
        <QueryProblem error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>
            {!counts
              ? '\u00a0'
              : show === 'all'
                ? `${counts.all} ${counts.all === 1 ? 'report' : 'reports'}, ${counts.open} open, ${counts.claimed} claimed`
                : `${counts[show]} ${SHOW_LABELS[show].toLowerCase()}`}
          </p>
          {/* Faded while another filter loads, over the rows still on show. */}
          <div
            className={[styles.list, list.isPlaceholderData ? styles.loading : ''].filter(Boolean).join(' ')}
            aria-busy={list.isPlaceholderData || undefined}
          >
            <div className={styles.headerRow} aria-hidden>
              <span />
              <span>Report</span>
              <span>Listing</span>
              <span>Posted by</span>
              <span>Reported by</span>
              <span>When</span>
              <span />
            </div>
            {reports === null ? (
              Array.from({ length: 4 }, (_, n) => (
                <div key={n} className={[styles.row, styles.boneRow].join(' ')}>
                  <Bone width={44} height={44} />
                  <Bone width="80%" height={12} />
                  <Bone width="70%" height={12} />
                  <Bone width="60%" height={12} />
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className={styles.none}>
                <p>{show === 'all' ? 'No reports yet.' : `No reports are ${SHOW_LABELS[show].toLowerCase()}.`}</p>
                {show !== 'all' ? (
                  <Button variant="secondary" size="sm" onClick={() => setShow('all')}>
                    Show all reports
                  </Button>
                ) : null}
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className={[styles.row, report.show === 'open' ? styles.unread : ''].filter(Boolean).join(' ')}
                  role="button"
                  tabIndex={0}
                  aria-label={`${REPORT_REASON_LABELS[report.reason]}, ${report.label}: open the report`}
                  onClick={() => setOpenId(report.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setOpenId(report.id);
                  }}
                >
                  {/* Open, nobody has it yet: a blue dot in the margin. */}
                  {report.show === 'open' ? <span className={styles.dot} aria-hidden /> : null}
                  <span className={styles.photo} aria-hidden>
                    {report.listing?.photo ? (
                      <img src={report.listing.photo} alt="" />
                    ) : (
                      <span className={styles.noPhoto}>
                        <ImageSmallIcon size={18} />
                      </span>
                    )}
                  </span>
                  <span className={styles.head}>
                    <Badge tone={reasonTone(report.reason)}>{REPORT_REASON_LABELS[report.reason]}</Badge>
                    <span className={styles.ref}>
                      {report.label}
                      <span className={styles.phoneOnly}> · {report.agoLabel}</span>
                    </span>
                  </span>
                  <span className={styles.listing}>
                    <span className={styles.strong}>
                      {report.listing ? listingLine(report.listing) : 'A person, not a listing'}
                    </span>
                  </span>
                  <span className={styles.posted}>
                    <span className={styles.strong}>{report.person.name}</span>
                    <span className={styles.small}>{recordLine(report.person)}</span>
                  </span>
                  <span className={styles.reporter}>
                    <span className={styles.strong}>{report.reporterName}</span>
                  </span>
                  <span className={styles.when}>{report.agoLabel}</span>
                  <span className={styles.status}>{status(report)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {opened && !deciding ? (
        <ReportDetail
          report={opened}
          busy={busy === opened.id}
          onClose={() => setOpenId(null)}
          onClaim={() => claim.mutate(opened)}
          onClear={() => setDeciding({ report: opened, decision: 'clear' })}
          onApprove={() => setDeciding({ report: opened, decision: 'approve' })}
        />
      ) : null}
      {deciding ? (
        <DecideSheet
          report={deciding.report}
          decision={deciding.decision}
          lead={lead}
          busy={busy === deciding.report.id}
          onClose={() => setDeciding(null)}
          onDecide={(body) => decide.mutate({ report: deciding.report, body })}
        />
      ) : null}
    </StaffPage>
  );
}

/** The full report: what was said, about whom, and what can be done with it
    now, or what was done. */
function ReportDetail({
  report,
  busy,
  onClose,
  onClaim,
  onClear,
  onApprove,
}: {
  report: Row;
  busy: boolean;
  onClose: () => void;
  onClaim: () => void;
  onClear: () => void;
  onApprove: () => void;
}) {
  const outcome =
    report.show !== 'open' && report.show !== 'claimed' && report.outcome ? OUTCOME[report.show] : null;
  return (
    <Sheet narrow title={`${REPORT_REASON_LABELS[report.reason]}, ${report.label}`} onClose={onClose}>
      <Stack gap={5}>
        <dl className={styles.facts}>
          {report.listing ? (
            <>
              <dt>Listing</dt>
              <dd>{listingLine(report.listing)}</dd>
            </>
          ) : null}
          <dt>{report.listing ? 'Posted by' : 'Person'}</dt>
          <dd>{report.person.name}</dd>
          <dt>Record</dt>
          <dd>{recordLine(report.person)}</dd>
          <dt>Reported by</dt>
          <dd>{report.reporterName}</dd>
          <dt>When</dt>
          <dd>{report.agoLabel}</dd>
          {report.details ? (
            <>
              <dt>Their words</dt>
              <dd>{report.details}</dd>
            </>
          ) : null}
          {outcome && report.outcome ? (
            <>
              <dt>Decided</dt>
              <dd>
                {outcome.label}
                {report.outcome.reversed ? ', reversed' : ''}, by {report.outcome.by}, {report.outcome.agoLabel}
              </dd>
              {report.outcome.note ? (
                <>
                  <dt>Why</dt>
                  <dd>{report.outcome.note}</dd>
                </>
              ) : null}
            </>
          ) : report.claimedBy && !report.mine ? (
            <>
              <dt>Claimed by</dt>
              <dd>{report.claimedBy}</dd>
            </>
          ) : null}
        </dl>
        {report.show === 'open' ? (
          <div className={styles.actions}>
            {report.listing ? (
              <ButtonLink href={`/listing/${report.listing.slug}`} variant="secondary">
                View this listing
              </ButtonLink>
            ) : (
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            )}
            <Button loading={busy} onClick={onClaim}>
              Claim
            </Button>
          </div>
        ) : report.mine ? (
          <>
            {report.listing ? (
              <ButtonLink href={`/listing/${report.listing.slug}`} variant="secondary" block>
                View this listing
              </ButtonLink>
            ) : null}
            <div className={styles.actions}>
              <Button variant="secondary" disabled={busy} onClick={onClear}>
                Clear
              </Button>
              <Button disabled={busy} onClick={onApprove}>
                Approve
              </Button>
            </div>
          </>
        ) : (
          <>
            {report.claimedBy && !outcome ? (
              <p className={styles.lead}>{report.claimedBy} is working on this report.</p>
            ) : null}
            {report.listing ? (
              <ButtonLink href={`/listing/${report.listing.slug}`} variant="secondary" block>
                View this listing
              </ButtonLink>
            ) : null}
          </>
        )}
      </Stack>
    </Sheet>
  );
}

/** Deciding a report, with a note saying why, which is required: the
    button stays off until there is one. Approving also takes the action,
    starting on the suggested one, and the reason, starting on the report's
    own, to correct it if it was filed wrong. Clearing takes only the note. */
function DecideSheet({
  report,
  decision,
  lead,
  busy,
  onClose,
  onDecide,
}: {
  report: Row;
  decision: 'approve' | 'clear';
  lead: boolean;
  busy: boolean;
  onClose: () => void;
  onDecide: (body: { decision: 'approve' | 'clear'; action?: ReportAction; reason?: ReportReason; note: string }) => void;
}) {
  const [action, setAction] = useState<ReportAction>(report.suggested);
  const [reason, setReason] = useState<ReportReason>(report.reason);
  const [note, setNote] = useState('');
  const actionLabel = useId();
  const reasonLabel = useId();
  const actions = (['warning', 'removal', 'suspension', 'ban'] as const).filter(
    (kind) => (kind !== 'removal' || report.listing) && (kind !== 'ban' || lead),
  );
  const approving = decision === 'approve';
  const ready = note.trim().length >= 2;

  return (
    <Sheet narrow title={`${approving ? 'Approve' : 'Clear'} ${report.label}`} onClose={onClose}>
      <Stack gap={5}>
        {approving ? (
          <>
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
          </>
        ) : (
          <p className={styles.lead}>Nothing happens to {report.person.name.replace(/\.$/, '')}. Say why the report is cleared.</p>
        )}
        <label className={styles.field}>
          <span className={styles.label}>Why you decided this</span>
          <textarea
            className={styles.textarea}
            rows={3}
            maxLength={500}
            placeholder={
              approving
                ? "e.g. Same photos as another seller's listing."
                : 'e.g. The photos are the seller’s own; the listing is accurate.'
            }
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {approving ? (
          <p className={styles.lead}>
            {report.person.name} is told what was decided, never who reported them.
          </p>
        ) : null}
        <Button
          size="lg"
          block
          loading={busy}
          disabled={!ready}
          onClick={() =>
            onDecide(
              approving
                ? { decision: 'approve', action, reason, note: note.trim() }
                : { decision: 'clear', note: note.trim() },
            )
          }
        >
          {approving ? 'Approve' : 'Clear'}
        </Button>
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}
