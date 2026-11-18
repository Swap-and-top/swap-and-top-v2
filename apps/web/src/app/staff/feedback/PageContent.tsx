'use client';

/**
 * Feedback, a section of the Staff console for everyone on the team: what
 * users told us from Send feedback, newest first (GET /api/staff/feedback).
 * Set as the Activity log is: a count line, then one white card with a pale
 * blue strip of headings, one line a message (when, who, what they said),
 * and the page buttons. A line opens the whole message, the page they were
 * on, and, for a signed in user, the account id to find their recording in
 * Clarity. Loaded through TanStack Query; the page on show stays while the
 * next one comes.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bone, Sheet, Stack } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { useLoadingBar } from '@/lib/loadingBar';
import { staffKeys } from '../sections';
import { Pager, PagerSkeleton, usePageSize } from '../Pager';
import { StaffPage } from '../StaffPage';
import table from '../activity/page.module.css';
import styles from './page.module.css';

interface Entry {
  id: string;
  message: string;
  page: string | null;
  person: { id: string; name: string } | null;
  atLabel: string;
}

export default function FeedbackPage() {
  const [page, setPage] = useState(1);
  const [size, setSize] = usePageSize('snt-feedback-size');
  const [open, setOpen] = useState<Entry | null>(null);

  const list = useQuery({
    queryKey: staffKeys.feedback(page, size),
    queryFn: () =>
      apiGet<{ entries: Entry[]; total: number }>(`/staff/feedback?page=${page}&size=${size}`).then((data) => ({
        ...data,
        page,
      })),
    // The page on show stays while the next one comes.
    placeholderData: keepPreviousData,
  });
  useLoadingBar(list.isPlaceholderData);
  const entries = list.data?.entries ?? null;
  const total = list.data?.total ?? 0;
  const shown = list.data?.page ?? page;

  return (
    <StaffPage title="Feedback" meta="What users told us, newest first">
      <p className={table.summary}>
        {entries === null ? ' ' : `${total} ${total === 1 ? 'message' : 'messages'}`}
      </p>
      {list.isError && !list.data ? <QueryProblem error={list.error} onRetry={() => void list.refetch()} /> : null}
      <div className={table.list} style={list.isError && !list.data ? { display: 'none' } : undefined}>
        <div className={table.headerRow} aria-hidden>
          <span>When</span>
          <span>Who</span>
          <span>What they said</span>
        </div>
        {entries === null ? (
          Array.from({ length: Number(size) }, (_, n) => (
            <div key={n} className={[table.row, table.boneRow].join(' ')}>
              <Bone width="80%" height={12} />
              <Bone width="70%" height={12} />
              <Bone width="60%" height={12} />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className={table.none}>
            <p>No feedback yet. It shows here as soon as a user sends some.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={[table.row, table.opens].join(' ')}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(entry)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setOpen(entry);
              }}
            >
              <span className={table.when}>{entry.atLabel}</span>
              <span className={table.who}>{entry.person?.name ?? 'Visitor'}</span>
              <span className={table.what} title={entry.message}>
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>

      {entries && total > 0 ? (
        <Pager
          shown={shown}
          total={total}
          size={size}
          loading={list.isPlaceholderData}
          what="Messages"
          onPage={setPage}
          onSize={(value) => {
            setSize(value);
            setPage(1);
          }}
        />
      ) : entries === null && !list.isError ? (
        <PagerSkeleton />
      ) : null}

      {open ? (
        <Sheet narrow title={`From ${open.person?.name ?? 'a visitor'}`} onClose={() => setOpen(null)}>
          <Stack gap={4}>
            <p className={styles.message}>{open.message}</p>
            <dl className={styles.facts}>
              <dt>Sent</dt>
              <dd>{open.atLabel}</dd>
              <dt>From the page</dt>
              <dd>{open.page ?? 'Not known'}</dd>
              {open.person ? (
                <>
                  <dt>Account id</dt>
                  <dd className={styles.id}>{open.person.id}</dd>
                </>
              ) : null}
            </dl>
            {open.person ? (
              <p className={styles.note}>
                To watch how they used the site, open Clarity&rsquo;s recordings and filter by Custom user ID, with this
                account id.
              </p>
            ) : (
              <p className={styles.note}>
                They were not signed in. Clarity&rsquo;s recordings from around this time, on this page, show how they
                got on.
              </p>
            )}
          </Stack>
        </Sheet>
      ) : null}
    </StaffPage>
  );
}
