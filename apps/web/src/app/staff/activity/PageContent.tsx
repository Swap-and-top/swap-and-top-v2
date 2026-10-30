'use client';

/**
 * The Activity log, a section of the Staff console, for Trust and safety:
 * what our team did, newest first (GET /api/staff/activity). Set as the
 * Store console's Stock page is: the search box and a Filters pill (From
 * and To days, in a sheet) over the table, a count line in the blue, and
 * the table in one white card under a pale blue strip of headings. One
 * line an action (when, who, what they did); 10 a page, or 20, 30 or 40
 * from the gear by the page buttons. A line about a person opens their
 * record. Read only. Members see what members did; leads and the super
 * admin see everything. Loaded through TanStack Query: each page, search
 * and set of days is kept once seen, and the page on show stays until the
 * next one comes.
 */

import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DEPARTMENT_LABELS, REPORT_REASON_LABELS, type Department, type ReportReason } from '@snt/core';
import { Bone, Button, Field, FieldRow, Panel, Sheet, useCloseSheet } from '@snt/ui';
import { FilterIcon } from '@snt/ui/icons';
import { apiGet, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { useDebounced } from '@/lib/useDebounced';
import { staffKeys } from '../sections';
import { Pager, PagerSkeleton, usePageSize } from '../Pager';
import { StaffPage } from '../StaffPage';
import shared from '../users/page.module.css';
import styles from './page.module.css';

interface Entry {
  id: string;
  action: string;
  detail: Record<string, unknown>;
  actor: { id: string; name: string };
  target?: { id: string; name: string };
  atLabel: string;
}

const KIND_DONE: Record<string, string> = {
  warning: 'a warning',
  removal: 'removing the listing',
  suspension: 'a 7 day suspension',
  ban: 'a ban',
};

/** What was done, after the name of who did it. */
function describe(entry: Entry): string {
  const who = entry.target?.name ?? 'someone';
  const detail = entry.detail;
  const dept = DEPARTMENT_LABELS[detail.department as Department] ?? String(detail.department ?? '');
  const reason = REPORT_REASON_LABELS[detail.reason as ReportReason]?.toLowerCase();
  // "REP 2026 0014", as the report is shown everywhere.
  const report = String(detail.reportLabel ?? `report ${String(detail.report ?? '')}`);
  switch (entry.action) {
    case 'team.add':
      return `added ${who} to ${dept}${detail.lead ? ' as its leader' : ''}`;
    case 'team.remove':
      return `took ${who} out of ${dept}`;
    case 'team.lead':
      return `made ${who} leader of ${dept}`;
    case 'team.unlead':
      return `made ${who} a member of ${dept}, no longer its leader`;
    case 'team.leave':
      return `removed ${who} from the team`;
    case 'report.approve':
      return `upheld ${report} about ${who}, with ${KIND_DONE[String(detail.kind)] ?? 'an action'}${reason ? ` (${reason})` : ''}`;
    case 'report.clear':
      return `cleared ${report} about ${who}`;
    case 'person.view':
      return `looked at ${who}’s record`;
    case 'person.warning':
      return `warned ${who}${reason ? ` (${reason})` : ''}`;
    case 'person.suspension':
      return `suspended ${who} for 7 days${reason ? ` (${reason})` : ''}`;
    case 'person.ban':
      return `banned ${who}${reason ? ` (${reason})` : ''}`;
    case 'appeal.uphold':
      return `upheld the decision on ${who}’s appeal`;
    case 'appeal.overturn':
      return `overturned the decision on ${who}’s appeal`;
    case 'store.verify':
      return `verified ${String(detail.store ?? 'the store')}, run by ${who}`;
    case 'store.decline':
      return `declined verifying ${String(detail.store ?? 'the store')}, run by ${who}`;
    default:
      return `${entry.action} on ${who}`;
  }
}

interface Filters {
  from: string;
  to: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const allowed = useInDepartment('trust_safety');
  const [page, setPage] = useState(1);
  const [size, setSize] = usePageSize('snt-activity-size');
  const [query, setQuery] = useState('');
  /** What was typed, once they stop typing for a moment. */
  const search = useDebounced(query.trim(), 300);
  const [filters, setFilters] = useState<Filters>({ from: '', to: '' });
  const [filtering, setFiltering] = useState(false);
  const inUse = (filters.from ? 1 : 0) + (filters.to ? 1 : 0);

  const log = useQuery({
    queryKey: staffKeys.activity({ page, size, search, ...filters }),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size });
      if (search) params.set('q', search);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      return apiGet<{ entries: Entry[]; total: number }>(`/staff/activity?${params}`).then((data) => ({ ...data, page }));
    },
    enabled: allowed === true,
    // The page on show stays while the next one comes.
    placeholderData: keepPreviousData,
  });
  const entries = log.data?.entries ?? null;
  const total = log.data?.total ?? 0;
  /** The page on show, which is not yet the one asked for while it loads. */
  const shown = log.data?.page ?? page;
  const loading = log.isPlaceholderData;

  const perPage = Number(size);
  const open = (entry: Entry) => {
    if (entry.target) router.push(`/staff/users/${encodeURIComponent(entry.target.id)}`);
  };

  return (
    <StaffPage
      title="Activity log"
      meta="What our team did, newest first"
      actions={
        allowed !== false ? (
          <div className={styles.toolbar}>
            <Field
              label="Search the log"
              hideLabel
              type="search"
              placeholder="e.g. Tarisai or warning"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              size="sm"
              filled
              className={styles.search}
            />
            {/* The Stock page's Filters pill: solid while open, with how
                many are in use. */}
            <button
              type="button"
              className={[styles.filter, filtering ? styles.filterOn : ''].filter(Boolean).join(' ')}
              aria-expanded={filtering}
              onClick={() => setFiltering(true)}
            >
              <FilterIcon size={15} weight={2} />
              Filters
              {inUse > 0 ? (
                <span className={styles.filterCount} aria-label={`${inUse} on`}>
                  {inUse}
                </span>
              ) : null}
            </button>
          </div>
        ) : null
      }
    >
      {allowed === false ? (
        <Panel padded>
          <p className={shared.lead}>Only Trust and safety can see the Activity log.</p>
        </Panel>
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>
            {entries === null
              ? '\u00a0'
              : `${total} ${total === 1 ? 'action' : 'actions'}${search || inUse ? ' found' : ''}`}
          </p>
          {log.isError && !log.data ? (
            <QueryProblem error={log.error} onRetry={() => void log.refetch()} />
          ) : null}
          <div className={styles.list} style={log.isError && !log.data ? { display: 'none' } : undefined}>
            <div className={styles.headerRow} aria-hidden>
              <span>When</span>
              <span>Who</span>
              <span>What they did</span>
            </div>
            {entries === null ? (
              // As many lines as a page shows (10 unless set otherwise).
              Array.from({ length: perPage }, (_, n) => (
                <div key={n} className={[styles.row, styles.boneRow].join(' ')}>
                  <Bone width="80%" height={12} />
                  <Bone width="70%" height={12} />
                  <Bone width="60%" height={12} />
                </div>
              ))
            ) : entries.length === 0 ? (
              <div className={styles.none}>
                <p>{search || inUse ? 'Nothing in the log matches.' : 'Nothing has been done yet.'}</p>
                {search || inUse ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setFilters({ from: '', to: '' });
                      setPage(1);
                    }}
                  >
                    Show everything
                  </Button>
                ) : null}
              </div>
            ) : (
              entries.map((entry) => {
                // With the note saying why, for a decision that has one.
                const note = typeof entry.detail.note === 'string' ? entry.detail.note : '';
                const said = describe(entry);
                // One full stop, even after a name such as "Tarisai M.".
                const what = `${said}${note ? `${said.endsWith('.') ? '' : '.'} Why: ${note}` : ''}`;
                return (
                  <div
                    key={entry.id}
                    className={[styles.row, entry.target ? styles.opens : ''].filter(Boolean).join(' ')}
                    role={entry.target ? 'link' : undefined}
                    tabIndex={entry.target ? 0 : undefined}
                    onClick={() => open(entry)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') open(entry);
                    }}
                  >
                    <span className={styles.when}>{entry.atLabel}</span>
                    <span className={styles.who}>{entry.actor.name}</span>
                    <span className={styles.what} title={what}>
                      {what.charAt(0).toUpperCase() + what.slice(1)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {entries && total > 0 ? (
            <Pager
              shown={shown}
              total={total}
              size={size}
              loading={loading}
              what="Actions"
              onPage={setPage}
              onSize={(value) => {
                setSize(value);
                setPage(1);
              }}
            />
          ) : entries === null && !log.isError ? (
            <PagerSkeleton />
          ) : null}
        </>
      )}

      {filtering ? (
        <Sheet title="Filters" narrow onClose={() => setFiltering(false)}>
          <FiltersForm
            filters={filters}
            onApply={(next) => {
              setFilters(next);
              setPage(1);
            }}
          />
        </Sheet>
      ) : null}

    </StaffPage>
  );
}

/** From and To days, tried out here and applied with the button. */
function FiltersForm({ filters, onApply }: { filters: Filters; onApply: (filters: Filters) => void }) {
  const close = useCloseSheet();
  const [draft, setDraft] = useState(filters);
  return (
    <div className={styles.form}>
      <FieldRow>
        <Field
          label="From"
          type="date"
          value={draft.from}
          max={draft.to || undefined}
          onChange={(event) => setDraft({ ...draft, from: event.target.value })}
        />
        <Field
          label="To"
          type="date"
          value={draft.to}
          min={draft.from || undefined}
          onChange={(event) => setDraft({ ...draft, to: event.target.value })}
        />
      </FieldRow>
      <div className={styles.actions}>
        <Button variant="secondary" size="lg" onClick={() => setDraft({ from: '', to: '' })}>
          Clear
        </Button>
        <Button
          size="lg"
          onClick={() => {
            onApply(draft);
            close();
          }}
        >
          Show the log
        </Button>
      </div>
    </div>
  );
}
