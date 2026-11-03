'use client';

/**
 * Growth, the Marketing section of the Staff console (GET /api/staff/growth):
 * a month or a year beside the one before. Visits and where visitors come
 * from are Umami's, sample figures until it is connected, and the page says
 * so; the rest is our own: new and active users and where the new ones came
 * from, top searches, each category's listings, views, number reveals and
 * Wanted listings, and boosts. Totals only; a figure about fewer than 5 users
 * shows as "Under 5". The charts and the look are Revenue's.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { CATEGORY_LABELS } from '@snt/core';
import { Chip, ChipRow, Dropdown, Panel } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { useLoadingBar } from '@/lib/loadingBar';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { Legend, LineChart, type Series } from '../revenue/charts';
import shared from '../revenue/page.module.css';
import Loading from './loading';
import styles from './page.module.css';

type Unit = 'month' | 'year';

interface Pair {
  current: number;
  previous: number;
}

interface Chart {
  labels: string[];
  current: number[];
  previous: number[];
}

interface Growth {
  unit: Unit;
  period: string;
  label: string;
  previousLabel: string;
  periods: { value: string; label: string }[];
  visits: {
    sample: boolean;
    visitors: Pair;
    visits: Pair;
    pageViews: Pair;
    chart: Chart;
    sources: { name: string; visits: number }[];
  };
  users: {
    newUsers: Pair;
    active: number;
    chart: Chart;
    sources: { name: string; users: number | null; posted: number | null }[];
  };
  searches: { total: Pair; top: { term: string; count: number; previous: number }[] };
  categories: {
    category: keyof typeof CATEGORY_LABELS;
    listings: number;
    views: number;
    reveals: number;
    wanted: number;
  }[];
  boosts: { started: Pair; views: Pair; reveals: Pair };
}

/** This period and the one before, as on Revenue. */
const CURRENT = '#1cb67f';
const PREVIOUS = '#255dab';

/** "12,480". */
const number = (n: number) => n.toLocaleString('en-US');

/** "Up 120 on Oct 2026", "Down 4 on ...", "Same as ...". */
function change(pair: Pair, label: string) {
  const diff = pair.current - pair.previous;
  return diff === 0 ? `Same as ${label}` : `${diff > 0 ? 'Up' : 'Down'} ${number(Math.abs(diff))} on ${label}`;
}

/** A source as shown: "Direct", "Not recorded", "google.com". */
const sourceName = (name: string) =>
  ({ direct: 'Direct', other: 'Other', 'not recorded': 'Not recorded' })[name] ?? name;

/** A figure about users, or "Under 5" where it is left out. */
const few = (n: number | null) => (n === null ? 'Under 5' : number(n));

export default function GrowthPage() {
  const allowed = useInDepartment('marketing');
  const periodLabel = useId();
  const [unit, setUnit] = useState<Unit>('month');
  /** None until chosen: the current one. */
  const [period, setPeriod] = useState<string | undefined>();

  const data = useQuery({
    queryKey: [...staffKeys.growth, { unit, period }],
    queryFn: () => {
      const params = new URLSearchParams({ unit });
      if (period) params.set('period', period);
      return apiGet<Growth>(`/staff/growth?${params}`);
    },
    enabled: allowed === true,
    // What is on show stays, faded, while the next comes.
    placeholderData: keepPreviousData,
  });

  // Another month or year on the way: the top bar runs.
  useLoadingBar(data.isPlaceholderData);

  // Until the period has come, the page's whole skeleton (rule 12).
  if (allowed !== false && !data.data && !data.isError) return <Loading />;
  const now = data.data;

  const series = (chart: Chart): Series[] =>
    now
      ? [
          { name: now.label, color: CURRENT, values: chart.current },
          { name: now.previousLabel, color: PREVIOUS, values: chart.previous },
        ]
      : [];
  const visitShare = now ? now.visits.sources.reduce((sum, row) => sum + row.visits, 0) : 0;

  return (
    <StaffPage
      title="Growth"
      meta="Visits, new users, searches and categories, a month or a year at a time"
      actions={
        now ? (
          <div className={shared.controls}>
            <ChipRow label="A month or a year">
              {(['month', 'year'] as const).map((value) => (
                <Chip
                  key={value}
                  selected={unit === value}
                  onClick={() => {
                    setUnit(value);
                    setPeriod(undefined);
                  }}
                >
                  {value === 'month' ? 'Month' : 'Year'}
                </Chip>
              ))}
            </ChipRow>
            <span id={periodLabel} hidden>
              Which {unit}
            </span>
            <Dropdown<string>
              value={now.period}
              options={now.periods}
              onChange={setPeriod}
              labelledBy={periodLabel}
              className={shared.filter}
            />
          </div>
        ) : null
      }
    >
      {allowed === false ? (
        <Panel padded>
          <p className={shared.lead}>Only Marketing can see this.</p>
        </Panel>
      ) : data.isError && !now ? (
        <QueryProblem error={data.error} onRetry={() => void data.refetch()} />
      ) : now ? (
        <div className={data.isPlaceholderData ? shared.loading : undefined} aria-busy={data.isPlaceholderData || undefined}>
          {now.visits.sample ? (
            <p className={shared.testNote} role="status">
              Visits and where visitors come from are sample figures. They will be real once Umami is connected.
            </p>
          ) : null}

          <div className={shared.tiles}>
            {(
              [
                ['Visitors', now.visits.visitors],
                ['Visits', now.visits.visits],
                ['New users', now.users.newUsers],
              ] as const
            ).map(([label, pair]) => (
              <div key={label} className={shared.tile}>
                <span className={shared.tileLabel}>{label}</span>
                <span className={shared.tileValue}>{number(pair.current)}</span>
                <span className={shared.tileNote}>{change(pair, now.previousLabel)}</span>
              </div>
            ))}
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Active users</span>
              <span className={shared.tileValue}>{number(now.users.active)}</span>
              <span className={shared.tileNote}>Used the app in the last 30 days</span>
            </div>
          </div>

          {(
            [
              ['Visits over time', now.visits.chart],
              ['New users over time', now.users.chart],
            ] as const
          ).map(([heading, chart]) => (
            <section key={heading} className={shared.card}>
              <div className={shared.cardHead}>
                <h2 className={shared.heading}>{heading}</h2>
              </div>
              <Legend items={series(chart)} line />
              <LineChart labels={chart.labels} series={series(chart)} label={`${heading}, ${now.label}`} count />
            </section>
          ))}

          <h2 className={shared.heading}>Where visitors come from</h2>
          <div className={shared.list}>
            <div className={[shared.headerRow, styles.twoRow].join(' ')} aria-hidden>
              <span>Site</span>
              <span>Visits</span>
              <span>Share</span>
            </div>
            {now.visits.sources.length === 0 ? (
              <div className={shared.none}>
                <p>No visits in {now.label}.</p>
              </div>
            ) : (
              now.visits.sources.map((row) => (
                <div key={row.name} className={[shared.row, styles.twoRow].join(' ')}>
                  <span className={shared.strong}>{sourceName(row.name)}</span>
                  <span className={shared.number}>{number(row.visits)}</span>
                  <span className={shared.number}>{visitShare ? Math.round((row.visits / visitShare) * 100) : 0}%</span>
                </div>
              ))
            )}
          </div>

          <h2 className={[shared.heading, styles.gap].join(' ')}>Where new users came from</h2>
          <div className={shared.list}>
            <div className={[shared.headerRow, styles.twoRow].join(' ')} aria-hidden>
              <span>Source</span>
              <span>New users</span>
              <span>Went on to post</span>
            </div>
            {now.users.sources.length === 0 ? (
              <div className={shared.none}>
                <p>No one joined in {now.label}.</p>
              </div>
            ) : (
              now.users.sources.map((row) => (
                <div key={row.name} className={[shared.row, styles.twoRow].join(' ')}>
                  <span className={shared.strong}>{sourceName(row.name)}</span>
                  <span className={shared.number}>{few(row.users)}</span>
                  <span className={shared.number}>{few(row.posted)}</span>
                </div>
              ))
            )}
          </div>

          <h2 className={[shared.heading, styles.gap].join(' ')}>Top searches</h2>
          <p className={styles.note}>
            {number(now.searches.total.current)} searches in {now.label}. Only searches made 5 times or more are listed.
          </p>
          <div className={shared.list}>
            <div className={[shared.headerRow, styles.twoRow].join(' ')} aria-hidden>
              <span>Search</span>
              <span>{now.label}</span>
              <span>{now.previousLabel}</span>
            </div>
            {now.searches.top.length === 0 ? (
              <div className={shared.none}>
                <p>No search was made 5 times or more in {now.label}.</p>
              </div>
            ) : (
              now.searches.top.map((row) => (
                <div key={row.term} className={[shared.row, styles.twoRow].join(' ')}>
                  <span className={shared.strong}>{row.term}</span>
                  <span className={shared.number}>{number(row.count)}</span>
                  <span className={shared.number}>{number(row.previous)}</span>
                </div>
              ))
            )}
          </div>

          <h2 className={[shared.heading, styles.gap].join(' ')}>Categories</h2>
          <div className={shared.list}>
            <div className={[shared.headerRow, styles.categoryRow].join(' ')} aria-hidden>
              <span>Category</span>
              <span>Listings</span>
              <span>Views</span>
              <span>Number reveals</span>
              <span>Wanted listings</span>
            </div>
            {now.categories.map((row) => (
              <div key={row.category} className={[shared.row, styles.categoryRow].join(' ')}>
                <span className={shared.strong}>{CATEGORY_LABELS[row.category]}</span>
                <span className={shared.number}>{number(row.listings)}</span>
                <span className={shared.number}>{number(row.views)}</span>
                <span className={shared.number}>{number(row.reveals)}</span>
                <span className={shared.number}>{number(row.wanted)}</span>
              </div>
            ))}
          </div>

          <h2 className={[shared.heading, styles.gap].join(' ')}>Boosts</h2>
          <div className={[shared.tiles, styles.threeTiles].join(' ')}>
            {(
              [
                ['Boosts started', now.boosts.started],
                ['Views while boosted', now.boosts.views],
                ['Number reveals while boosted', now.boosts.reveals],
              ] as const
            ).map(([label, pair]) => (
              <div key={label} className={shared.tile}>
                <span className={shared.tileLabel}>{label}</span>
                <span className={shared.tileValue}>{number(pair.current)}</span>
                <span className={shared.tileNote}>{change(pair, now.previousLabel)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </StaffPage>
  );
}
