'use client';

/**
 * Appeals, a section of the Staff console, for Trust and safety leaders
 * (GET /api/staff/appeals): every appeal about users this leader may act on,
 * whatever became of it, set as Reports and Users are. The waiting ones come
 * first, oldest first (never an appeal against this leader's own decision),
 * then the decided ones, newest first. The filter narrows it to waiting,
 * upheld or overturned, each with its count. On a laptop a table; below, one
 * compact line each, as an email in a mail app. Waiting ones read as unread,
 * bold with a blue dot and a small Decide button. A row opens the full
 * appeal: what was decided and why, their words, their record, and Uphold
 * or Overturn, each with the note the user is told
 * (POST /api/staff/appeals/{id}); overturning undoes the action and keeps
 * its record. Once decided, the sheet says by whom and why.
 */

import Link from 'next/link';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { REPORT_REASON_LABELS, type ReportReason } from '@snt/core';
import { Badge, Bone, Button, ButtonLink, Dropdown, Panel, Sheet, Stack, type BadgeTone } from '@snt/ui';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import styles from './page.module.css';

type Show = 'all' | 'waiting' | 'upheld' | 'overturned';
type Outcome = 'upheld' | 'overturned';

interface Appeal {
  id: string;
  person: { id: string; name: string };
  kind: 'warning' | 'removal' | 'suspension' | 'ban';
  reason: ReportReason;
  listingTitle?: string;
  note?: string;
  decidedBy: string;
  decidedLabel: string;
  fromReport: boolean;
  statement: string;
  agoLabel: string;
  state: 'waiting' | Outcome;
  outcome?: { by: string; dateLabel: string; reason?: string };
}

interface AppealList {
  appeals: Appeal[];
  counts: Record<Show, number>;
}

/** The filter's choices, in its order. */
const SHOW_LABELS: Record<Show, string> = {
  all: 'All appeals',
  waiting: 'Waiting',
  upheld: 'Upheld',
  overturned: 'Overturned',
};

/** What was decided, as a pill, as on a user's record. */
const DECISION: Record<Appeal['kind'], { label: string; tone: BadgeTone }> = {
  warning: { label: 'Warned', tone: 'warning' },
  removal: { label: 'Listing removed', tone: 'warning' },
  suspension: { label: 'Suspended', tone: 'danger' },
  ban: { label: 'Banned', tone: 'dark' },
};

/** How the appeal was decided, as a pill. */
const OUTCOME: Record<Outcome, { label: string; tone: BadgeTone }> = {
  upheld: { label: 'Upheld', tone: 'neutral' },
  overturned: { label: 'Overturned', tone: 'success' },
};

/** "FD" from "Farai D.". */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'
  );
}

export default function AppealsPage() {
  const leader = useInDepartment('trust_safety', true);
  const showLabel = useId();
  const [show, setShow] = useState<Show>('all');
  /** The appeal open in its sheet, by id, so it follows the list. */
  const [openId, setOpenId] = useState<string | null>(null);
  /** Which way it is being decided, while the note is asked for. */
  const [deciding, setDeciding] = useState<Outcome | null>(null);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...staffKeys.appeals, show],
    queryFn: () => apiGet<AppealList>(`/staff/appeals?show=${show}`),
    enabled: leader === true,
    // The rows on show stay while another filter loads.
    placeholderData: keepPreviousData,
  });
  const appeals = list.data?.appeals ?? null;
  const counts = list.data?.counts;
  const opened = appeals?.find((appeal) => appeal.id === openId) ?? null;

  const close = () => {
    setOpenId(null);
    setDeciding(null);
    setNote('');
  };

  const decide = useMutation({
    mutationFn: ({ appeal, outcome }: { appeal: Appeal; outcome: Outcome }) =>
      apiSend(`/staff/appeals/${encodeURIComponent(appeal.id)}`, 'POST', { outcome, reason: note.trim() }),
    onSuccess: (_, { appeal, outcome }) => {
      // Every filter of the list, the counts, the log and their record.
      void queryClient.invalidateQueries({ queryKey: staffKeys.appeals });
      void queryClient.invalidateQueries({ queryKey: staffKeys.counts });
      void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
      void queryClient.invalidateQueries({ queryKey: staffKeys.user(appeal.person.id) });
      close();
      toast.success(
        outcome === 'overturned'
          ? `Overturned. ${appeal.person.name} has been told, and it is undone.`
          : `Upheld. ${appeal.person.name} has been told.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <StaffPage
      title="Appeals"
      meta="Users asking us to look again, the waiting ones first"
      actions={
        leader ? (
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
      {leader === false ? (
        <Panel padded>
          <p className={styles.lead}>Only Trust and safety leaders decide appeals.</p>
        </Panel>
      ) : list.isError && !list.data ? (
        <QueryProblem error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>
            {!counts
              ? ' '
              : show === 'all'
                ? `${counts.all} ${counts.all === 1 ? 'appeal' : 'appeals'}, ${counts.waiting} waiting`
                : `${counts[show]} ${SHOW_LABELS[show].toLowerCase()}`}
          </p>
          {/* Faded while another filter loads, over the rows still on show. */}
          <div
            className={[styles.list, list.isPlaceholderData ? styles.loading : ''].filter(Boolean).join(' ')}
            aria-busy={list.isPlaceholderData || undefined}
          >
            <div className={styles.headerRow} aria-hidden>
              <span />
              <span>User</span>
              <span>Decided</span>
              <span>Reason</span>
              <span>Decided by</span>
              <span>Appealed</span>
              <span />
            </div>
            {appeals === null ? (
              // Loading: rows of the table's own shape.
              Array.from({ length: 3 }, (_, n) => (
                <div key={n} className={[styles.row, styles.boneRow].join(' ')} aria-hidden>
                  <Bone width={32} height={32} shape="circle" />
                  <Bone width="70%" height={12} />
                  <span className={styles.decision}>
                    <Bone width={70} height={20} shape="pill" />
                  </span>
                  <span className={styles.reason}>
                    <Bone width="70%" height={12} />
                  </span>
                  <span className={styles.by}>
                    <Bone width="60%" height={12} />
                  </span>
                  <span className={styles.when}>
                    <Bone width={50} height={12} />
                  </span>
                  <span className={styles.status}>
                    <Bone width={64} height={26} shape="pill" />
                  </span>
                </div>
              ))
            ) : appeals.length === 0 ? (
              <div className={styles.none}>
                <p>{show === 'all' ? 'No appeals yet.' : `No appeals are ${SHOW_LABELS[show].toLowerCase()}.`}</p>
                {show !== 'all' ? (
                  <Button variant="secondary" size="sm" onClick={() => setShow('all')}>
                    Show all appeals
                  </Button>
                ) : null}
              </div>
            ) : (
              appeals.map((appeal) => {
                const waiting = appeal.state === 'waiting';
                const decision = DECISION[appeal.kind];
                return (
                  <div
                    key={appeal.id}
                    className={[styles.row, waiting ? styles.unread : ''].filter(Boolean).join(' ')}
                    role="button"
                    tabIndex={0}
                    aria-label={`${appeal.person.name}, appeal against ${decision.label.toLowerCase()}: open it`}
                    onClick={() => setOpenId(appeal.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') setOpenId(appeal.id);
                    }}
                  >
                    {waiting ? <span className={styles.dot} aria-hidden /> : null}
                    <span className={styles.initials} aria-hidden>
                      {initialsOf(appeal.person.name)}
                    </span>
                    <span className={styles.head}>
                      <span className={styles.strong}>{appeal.person.name}</span>
                      <span className={styles.phoneOnly}>
                        <Badge tone={decision.tone}>{decision.label}</Badge>
                      </span>
                    </span>
                    <span className={styles.statement}>“{appeal.statement}”</span>
                    <span className={styles.decision}>
                      <Badge tone={decision.tone}>{decision.label}</Badge>
                    </span>
                    <span className={styles.reason}>{REPORT_REASON_LABELS[appeal.reason]}</span>
                    <span className={styles.by}>{appeal.decidedBy}</span>
                    <span className={styles.when}>{appeal.agoLabel}</span>
                    <span className={styles.status}>
                      {waiting ? (
                        <button
                          type="button"
                          className={styles.claim}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenId(appeal.id);
                          }}
                        >
                          Decide
                        </button>
                      ) : (
                        <Badge tone={OUTCOME[appeal.state as Outcome].tone}>
                          {OUTCOME[appeal.state as Outcome].label}
                        </Badge>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {opened && !deciding ? (
        <AppealDetail appeal={opened} onClose={close} onDecide={setDeciding} />
      ) : null}
      {opened && deciding ? (
        <Sheet
          narrow
          title={deciding === 'overturned' ? 'Overturn the decision' : 'Uphold the decision'}
          onClose={() => setDeciding(null)}
        >
          <Stack gap={4}>
            <p className={styles.lead}>
              {deciding === 'overturned'
                ? `It is undone for ${opened.person.name}, and stays on record as overturned. Tell them why.`
                : `It stays as it is. Tell ${opened.person.name} why.`}
            </p>
            <textarea
              className={styles.textarea}
              rows={3}
              maxLength={500}
              placeholder={
                deciding === 'overturned'
                  ? 'e.g. The receipt shows the phone is yours.'
                  : 'e.g. The photos match another seller’s listing.'
              }
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            {/* A note saying why is required: off until there is one. */}
            <Button
              size="lg"
              block
              disabled={note.trim().length < 2}
              loading={decide.isPending}
              onClick={() => decide.mutate({ appeal: opened, outcome: deciding })}
            >
              {deciding === 'overturned' ? 'Overturn' : 'Uphold'}
            </Button>
            <Button variant="secondary" size="lg" block onClick={() => setDeciding(null)}>
              Cancel
            </Button>
          </Stack>
        </Sheet>
      ) : null}
    </StaffPage>
  );
}

/** The full appeal: what was decided and why, their words, and Uphold or
    Overturn while it waits; once decided, by whom and why. */
function AppealDetail({
  appeal,
  onClose,
  onDecide,
}: {
  appeal: Appeal;
  onClose: () => void;
  onDecide: (outcome: Outcome) => void;
}) {
  const decision = DECISION[appeal.kind];
  return (
    <Sheet narrow title={`${appeal.person.name}’s appeal`} onClose={onClose}>
      <Stack gap={5}>
        <dl className={styles.facts}>
          <dt>User</dt>
          <dd>
            <Link href={`/staff/users/${encodeURIComponent(appeal.person.id)}`} className={styles.personLink}>
              {appeal.person.name}
            </Link>
          </dd>
          <dt>Decided</dt>
          <dd>
            {decision.label}
            {appeal.listingTitle ? `, ${appeal.listingTitle}` : ''}
          </dd>
          <dt>Reason</dt>
          <dd>{REPORT_REASON_LABELS[appeal.reason]}</dd>
          <dt>By</dt>
          <dd>
            {appeal.decidedBy} on {appeal.decidedLabel}
            {appeal.fromReport ? ', from a report' : ''}
          </dd>
          {appeal.note ? (
            <>
              <dt>Why</dt>
              <dd>{appeal.note}</dd>
            </>
          ) : null}
          <dt>Their appeal</dt>
          <dd>“{appeal.statement}”</dd>
          <dt>Appealed</dt>
          <dd>{appeal.agoLabel}</dd>
          {appeal.outcome ? (
            <>
              <dt>Outcome</dt>
              <dd>
                {OUTCOME[appeal.state as Outcome].label}, by {appeal.outcome.by} on {appeal.outcome.dateLabel}
              </dd>
              {appeal.outcome.reason ? (
                <>
                  <dt>Their note</dt>
                  <dd>{appeal.outcome.reason}</dd>
                </>
              ) : null}
            </>
          ) : null}
        </dl>
        <ButtonLink href={`/staff/users/${encodeURIComponent(appeal.person.id)}`} variant="secondary" block>
          View their record
        </ButtonLink>
        {appeal.state === 'waiting' ? (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => onDecide('upheld')}>
              Uphold
            </Button>
            <Button onClick={() => onDecide('overturned')}>Overturn</Button>
          </div>
        ) : null}
      </Stack>
    </Sheet>
  );
}
