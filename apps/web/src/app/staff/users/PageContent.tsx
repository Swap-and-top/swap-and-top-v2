'use client';

/**
 * People, a section of the Staff console, for Trust and safety: everyone,
 * newest first (GET /api/staff/users), set as Reports and the Activity log
 * are. The search box (a name or a phone number) and one filter (a
 * standing, or our own team, with counts) over the table; the table in one
 * white card under the pale blue strip of headings; the page buttons under
 * it (10 a page, or 20, 30 or 40 from the gear). On a phone each person is
 * one compact line. A row opens their record (./[id]).
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Badge, Bone, Button, Dropdown, Field, Panel } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { useDebounced } from '@/lib/useDebounced';
import { Pager, PagerSkeleton, usePageSize } from '../Pager';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { initialsOf, STANDING_LABEL, STANDING_TONE } from './standing';
import styles from './list.module.css';

interface Found {
  id: string;
  name: string;
  phone?: string;
  location?: string;
  standing: string;
  joinedLabel: string;
  liveListings: number;
  reports: number;
  teamLabel?: string;
}

type Show = 'all' | 'good' | 'warned' | 'suspended' | 'banned' | 'team';

/** The filter's choices, in its order. */
const SHOW_LABELS: Record<Show, string> = {
  all: 'All users',
  good: 'Good standing',
  warned: 'Warned',
  suspended: 'Suspended',
  banned: 'Banned',
  team: 'On our team',
};

export default function PeoplePage() {
  const router = useRouter();
  const allowed = useInDepartment('trust_safety');
  const showLabel = useId();
  const [query, setQuery] = useState('');
  /** What was typed, once they stop typing for a moment. */
  const search = useDebounced(query.trim(), 250);
  const [show, setShow] = useState<Show>('all');
  const [page, setPage] = useState(1);
  const [size, setSize] = usePageSize('snt-users-size');

  const list = useQuery({
    queryKey: staffKeys.users(JSON.stringify({ search, show, page, size })),
    queryFn: () => {
      const params = new URLSearchParams({ show, page: String(page), size });
      if (search) params.set('q', search);
      return apiGet<{ people: Found[]; total: number; counts: Record<Show, number> }>(`/staff/users?${params}`).then(
        (data) => ({ ...data, page }),
      );
    },
    enabled: allowed === true,
    // The rows on show stay while the next ones come.
    placeholderData: keepPreviousData,
  });
  const people = list.data?.people ?? null;
  const total = list.data?.total ?? 0;
  const counts = list.data?.counts;
  /** The page on show, which is not yet the one asked for while it loads. */
  const shown = list.data?.page ?? page;
  const open = (person: Found) => router.push(`/staff/users/${encodeURIComponent(person.id)}`);

  return (
    <StaffPage
      title="Users"
      meta="Every user, newest first"
      actions={
        allowed !== false ? (
          <div className={styles.toolbar}>
            <Field
              label="Find a user"
              hideLabel
              type="search"
              placeholder="e.g. Tarisai or 077 000 0001"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              size="sm"
              filled
              className={styles.search}
            />
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
              onChange={(value) => {
                setShow(value);
                setPage(1);
              }}
              labelledBy={showLabel}
              className={styles.filter}
            />
          </div>
        ) : null
      }
    >
      {allowed === false ? (
        <Panel padded>
          <p className={styles.lead}>Only Trust and safety can look up users.</p>
        </Panel>
      ) : list.isError && !list.data ? (
        <QueryProblem error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>
            {!counts
              ? ' '
              : `${total} ${total === 1 ? 'user' : 'users'}${search || show !== 'all' ? ' found' : ''}`}
          </p>
          {/* Faded while the next rows load, over those still on show. */}
          <div
            className={[styles.list, list.isPlaceholderData ? styles.loading : ''].filter(Boolean).join(' ')}
            aria-busy={list.isPlaceholderData || undefined}
          >
            <div className={styles.headerRow} aria-hidden>
              <span />
              <span>Name</span>
              <span>Phone</span>
              <span>Area</span>
              <span>Joined</span>
              <span>Listings</span>
              <span>Reports</span>
              <span>Standing</span>
            </div>
            {people === null ? (
              Array.from({ length: Number(size) }, (_, n) => (
                <div key={n} className={[styles.row, styles.boneRow].join(' ')}>
                  <Bone width={32} height={32} shape="circle" />
                  <Bone width="70%" height={12} />
                  <Bone width="60%" height={12} />
                </div>
              ))
            ) : people.length === 0 ? (
              <div className={styles.none}>
                <p>Nobody matches.</p>
                {search || show !== 'all' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setShow('all');
                      setPage(1);
                    }}
                  >
                    Show all users
                  </Button>
                ) : null}
              </div>
            ) : (
              people.map((person) => (
                <div
                  key={person.id}
                  className={styles.row}
                  role="link"
                  tabIndex={0}
                  aria-label={`${person.name}: open their record`}
                  onClick={() => open(person)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') open(person);
                  }}
                >
                  <span className={styles.initials} aria-hidden>
                    {initialsOf(person.name)}
                  </span>
                  <span className={styles.name}>
                    <span className={styles.strong}>{person.name}</span>
                    {person.teamLabel ? <Badge tone="accent">{person.teamLabel}</Badge> : null}
                    {/* On a phone the number sits under the name. */}
                    <span className={styles.phoneOnly}>{person.phone ?? 'No number'}</span>
                  </span>
                  <span className={styles.phone}>{person.phone ?? 'None'}</span>
                  <span className={styles.area}>{person.location ?? 'Not given'}</span>
                  <span className={styles.joined}>{person.joinedLabel}</span>
                  <span className={styles.count}>{person.liveListings}</span>
                  <span className={styles.count}>{person.reports}</span>
                  <span className={styles.standing}>
                    <Badge tone={STANDING_TONE[person.standing] ?? 'neutral'}>
                      {STANDING_LABEL[person.standing] ?? person.standing}
                    </Badge>
                  </span>
                </div>
              ))
            )}
          </div>

          {people && total > 0 ? (
            <Pager
              shown={shown}
              total={total}
              size={size}
              loading={list.isPlaceholderData}
              what="Users"
              onPage={setPage}
              onSize={(value) => {
                setSize(value);
                setPage(1);
              }}
            />
          ) : people === null ? (
            <PagerSkeleton />
          ) : null}
        </>
      )}
    </StaffPage>
  );
}
