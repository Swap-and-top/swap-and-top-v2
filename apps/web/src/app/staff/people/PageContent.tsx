'use client';

/**
 * People, a section of the Staff console, for Trust and safety: find anyone
 * by name or phone number (GET /api/staff/people, through TanStack Query),
 * searched as they type, and open their record (./[id]).
 */

import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Field, Panel, Stack } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { useDebounced } from '@/lib/useDebounced';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { STANDING_LABEL } from './standing';
import styles from './page.module.css';

interface Found {
  id: string;
  name: string;
  phone?: string;
  location?: string;
  standing: string;
}

export default function PeoplePage() {
  const allowed = useInDepartment('trust_safety');
  const [query, setQuery] = useState('');
  // Searched as they type, from two letters or digits, once they pause.
  const q = useDebounced(query.trim(), 250);
  const search = useQuery({
    queryKey: staffKeys.people(q),
    queryFn: () => apiGet<{ people: Found[] }>(`/staff/people?q=${encodeURIComponent(q)}`).then((data) => data.people),
    enabled: allowed === true && q.length >= 2,
    // The last answer stays while the next comes, so the list does not blink.
    placeholderData: keepPreviousData,
  });
  const found = query.trim().length >= 2 ? search.data : undefined;

  return (
    <StaffPage title="People" meta="Find anyone, and see their record">
      <Stack gap={6}>
        {allowed === false ? (
          <Panel padded>
            <p className={styles.lead}>Only Trust and safety can look up people.</p>
          </Panel>
        ) : (
          <Panel padded>
            <Stack gap={5}>
              <Field
                label="Find them by name or phone number"
                placeholder="e.g. Tarisai or 077 000 0001"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
              {search.isError && query.trim().length >= 2 ? (
                <QueryProblem error={search.error} onRetry={() => void search.refetch()} />
              ) : !found ? null : found.length === 0 ? (
                <p className={styles.lead}>Nobody matches.</p>
              ) : (
                <div className={styles.results}>
                  {found.map((person) => (
                    <Link key={person.id} href={`/staff/people/${encodeURIComponent(person.id)}`} className={styles.result}>
                      <span>
                        <strong>{person.name}</strong>
                        {person.phone ? <span className={styles.muted}> · {person.phone}</span> : null}
                      </span>
                      <span className={styles.muted}>{STANDING_LABEL[person.standing] ?? person.standing}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Stack>
          </Panel>
        )}
      </Stack>
    </StaffPage>
  );
}
