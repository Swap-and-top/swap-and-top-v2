'use client';

/**
 * Stores, in the Staff console, set as Users and Reports are. Its tabs
 * follow the departments: for Sales (GET /api/staff/sales), All stores,
 * every open store with its owner, listings and pass, and Stores to call,
 * those worth phoning (near the free limit, pass ending soon or lapsed,
 * and users near the limit of 5 with no store); for Trust and safety
 * leaders, Verify stores (VerifyTab), the stores asking for the badge.
 * The super admin sees all three. `?tab=verify` opens on the last. Under them the search box and one filter,
 * with counts, for that tab; the table, the fullest first; the page
 * buttons; on a phone one compact line each.
 * A number shows one at a time, on Show number
 * (GET /api/staff/sales/phone/{personId}), each look logged: for calling,
 * not copying.
 */

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Dropdown, Field, Panel, Tabs, type BadgeTone } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { useLoadingBar } from '@/lib/loadingBar';
import { useInDepartment } from '@/lib/staff';
import { useDebounced } from '@/lib/useDebounced';
import { Pager, usePageSize } from '../Pager';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { initialsOf } from '../users/standing';
import Loading from './loading';
import { VerifyTab } from './VerifyTab';
import styles from './page.module.css';

type Tab = 'stores' | 'call' | 'verify';
type SalesTab = Exclude<Tab, 'verify'>;
type Show = 'stores' | 'free' | 'paid' | 'verified' | 'call' | 'near' | 'ending' | 'lapsed' | 'users';

interface Row {
  id: string;
  kind: 'store' | 'user';
  name: string;
  ownerId: string;
  ownerName: string;
  area: string;
  live: number;
  limit?: number;
  state: 'free' | 'paid' | 'ending' | 'lapsed' | 'none';
  paidUntilLabel?: string;
  verified: boolean;
}

/** Each tab's filter, its choices in order; the first is the whole tab. */
const FILTERS: Record<SalesTab, Show[]> = {
  stores: ['stores', 'free', 'paid', 'verified'],
  call: ['call', 'near', 'ending', 'lapsed', 'users'],
};

const SHOW_LABELS: Record<Show, string> = {
  stores: 'All stores',
  free: 'Free stores',
  paid: 'Paid stores',
  verified: 'Verified stores',
  call: 'Everyone to call',
  near: 'Stores near the limit',
  ending: 'Pass ending soon',
  lapsed: 'Pass lapsed',
  users: 'Users near the limit',
};

/** How a pass stands, as a pill. */
function passPill(row: Row): { label: string; tone: BadgeTone } {
  switch (row.state) {
    case 'paid':
      return { label: `Paid to ${row.paidUntilLabel}`, tone: 'success' };
    case 'ending':
      return { label: `Ends ${row.paidUntilLabel}`, tone: 'warning' };
    case 'lapsed':
      return { label: 'Lapsed', tone: 'danger' };
    case 'free':
      return { label: 'Free store', tone: 'neutral' };
    default:
      return { label: 'No store', tone: 'neutral' };
  }
}

/** "077 123 4567" as a number to call: +263 77 123 4567. */
const telOf = (phone: string) => `tel:+263${phone.replace(/\D/g, '').slice(1)}`;

const TAB_LABELS: Record<Tab, string> = {
  stores: 'All stores',
  call: 'Stores to call',
  verify: 'Verify stores',
};

export default function StoresPage({ initialTab }: { initialTab?: Tab }) {
  const sales = useInDepartment('sales');
  const leader = useInDepartment('trust_safety', true);
  /** The tabs this person has: Sales', then Trust and safety leaders'. */
  const mine: Tab[] = [...(sales ? (['stores', 'call'] as const) : []), ...(leader ? (['verify'] as const) : [])];
  const [chosen, setChosen] = useState<Tab | undefined>(initialTab);
  const tab = chosen && mine.includes(chosen) ? chosen : (mine[0] ?? 'stores');

  /** The tabs, with what each tab knows of its own counts. */
  const tabs = (counts: Partial<Record<Tab, number>>) =>
    mine.length > 1 ? (
      <div className={styles.tabs}>
        <Tabs<Tab>
          tabs={mine.map((value) => ({ value, label: TAB_LABELS[value], count: counts[value] }))}
          active={tab}
          onChange={setChosen}
          label="Which stores"
        />
      </div>
    ) : null;

  if (sales === undefined) return <Loading />;
  if (tab === 'verify') return <VerifyTab tabs={(waiting) => tabs({ verify: waiting })} />;
  return <SalesStores tab={tab} allowed={sales} tabs={tabs} />;
}

/** All stores and Stores to call, for Sales. */
function SalesStores({
  tab,
  allowed,
  tabs,
}: {
  tab: SalesTab;
  allowed: boolean;
  tabs: (counts: Partial<Record<Tab, number>>) => ReactNode;
}) {
  const showLabel = useId();
  const [query, setQuery] = useState('');
  /** What was typed, once they stop typing for a moment. */
  const search = useDebounced(query.trim(), 250);
  const [show, setShow] = useState<Show>(FILTERS[tab][0]!);
  const [page, setPage] = useState(1);
  // Another tab: its whole list, from the first page (set while rendering,
  // so no effect is needed).
  const [tabShown, setTabShown] = useState(tab);
  if (tabShown !== tab) {
    setTabShown(tab);
    setShow(FILTERS[tab][0]!);
    setPage(1);
  }
  const [size, setSize] = usePageSize('snt-sales-size');
  /** The numbers shown so far, by person: asked for one at a time. */
  const [numbers, setNumbers] = useState<Record<string, string>>({});

  const list = useQuery({
    queryKey: [...staffKeys.sales, { search, show, page, size }],
    queryFn: () => {
      const params = new URLSearchParams({ show, page: String(page), size });
      if (search) params.set('q', search);
      return apiGet<{ rows: Row[]; total: number; counts: Record<Show, number> }>(`/staff/sales?${params}`).then(
        (data) => ({ ...data, page }),
      );
    },
    enabled: allowed === true,
    // The rows on show stay while the next ones come.
    placeholderData: keepPreviousData,
  });

  // Other rows on the way (a tab, a filter, a search, a page): the top bar runs.
  useLoadingBar(list.isPlaceholderData);

  const reveal = useMutation({
    mutationFn: (personId: string) =>
      apiGet<{ phone?: string }>(`/staff/sales/phone/${encodeURIComponent(personId)}`),
    onSuccess: ({ phone }, personId) => setNumbers((now) => ({ ...now, [personId]: phone ?? 'No number' })),
    onError: (error) => toast.error(error.message),
  });

  // Until its rows have come, the page's whole skeleton (rule 12).
  if (allowed !== false && !list.data && !list.isError) return <Loading />;

  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const counts = list.data?.counts;
  /** The page on show, which is not yet the one asked for while it loads. */
  const shown = list.data?.page ?? page;

  return (
    <StaffPage
      title="Stores"
      meta="Every store, and who to call, the fullest first"
      actions={
        allowed !== false ? (
          <>
          {tabs({ stores: counts?.stores, call: counts?.call })}
          <div className={styles.toolbar}>
            <Field
              label="Find a store"
              hideLabel
              type="search"
              placeholder="e.g. Kopje or Mbare"
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
              options={FILTERS[tab].map((value) => ({
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
          </>
        ) : null
      }
    >
      {allowed === false ? (
        <Panel padded>
          <p className={styles.lead}>Only Sales can see this.</p>
        </Panel>
      ) : list.isError && !list.data ? (
        <QueryProblem error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>
            {total} {show === FILTERS[tab][0] && !search ? 'in all' : 'found'}
          </p>
          {/* Faded while the next rows load, over those still on show. */}
          <div
            className={[styles.list, list.isPlaceholderData ? styles.loading : ''].filter(Boolean).join(' ')}
            aria-busy={list.isPlaceholderData || undefined}
          >
            <div className={styles.headerRow} aria-hidden>
              <span />
              <span>Store</span>
              <span>Owner</span>
              <span>Area</span>
              <span>Listings</span>
              <span>Pass</span>
              <span />
            </div>
            {rows.length === 0 ? (
              <div className={styles.none}>
                <p>Nothing matches.</p>
                {search || show !== FILTERS[tab][0] ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setShow(FILTERS[tab][0]!);
                      setPage(1);
                    }}
                  >
                    Show everything
                  </Button>
                ) : null}
              </div>
            ) : (
              rows.map((row) => {
                const pill = passPill(row);
                const number = numbers[row.ownerId];
                return (
                  <div key={`${row.kind}-${row.id}`} className={styles.row}>
                    <span className={styles.initials} aria-hidden>
                      {initialsOf(row.name)}
                    </span>
                    <span className={styles.head}>
                      <span className={styles.strong}>{row.name}</span>
                      {row.verified ? <Badge tone="accent">Verified</Badge> : null}
                    </span>
                    {/* On a phone, under the name. */}
                    <span className={styles.sub}>
                      {row.kind === 'store' ? `${row.ownerName}, ` : ''}
                      {row.limit ? `${row.live} of ${row.limit} listings` : `${row.live} listings`}
                    </span>
                    <span className={styles.owner}>{row.kind === 'store' ? row.ownerName : 'Their own account'}</span>
                    <span className={styles.area}>{row.area || 'Not given'}</span>
                    <span className={styles.live}>{row.limit ? `${row.live} of ${row.limit}` : row.live}</span>
                    <span className={styles.pass}>
                      <Badge tone={pill.tone}>{pill.label}</Badge>
                    </span>
                    <span className={styles.call}>
                      {number ? (
                        number === 'No number' ? (
                          <span className={styles.noNumber}>No number</span>
                        ) : (
                          <a href={telOf(number)} className={styles.number}>
                            {number}
                          </a>
                        )
                      ) : (
                        <button
                          type="button"
                          className={styles.claim}
                          disabled={reveal.isPending && reveal.variables === row.ownerId}
                          onClick={() => reveal.mutate(row.ownerId)}
                        >
                          Show number
                        </button>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {total > 0 ? (
            <Pager
              shown={shown}
              total={total}
              size={size}
              loading={list.isPlaceholderData}
              what="Stores"
              onPage={setPage}
              onSize={(value) => {
                setSize(value);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}
    </StaffPage>
  );
}
