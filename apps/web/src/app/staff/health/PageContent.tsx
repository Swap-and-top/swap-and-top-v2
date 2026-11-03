'use client';

/**
 * Health, the DevOps section of the Staff console (GET /api/staff/health):
 * how things stand now (the database's answer time, connections and size,
 * the store pass check, the deploy running) and the last 30 days of errors
 * and slow requests, by day, by route and the latest, with each month's
 * totals for the last year. No user data: only route patterns. The look is
 * Revenue's and Growth's.
 */

import { useQuery } from '@tanstack/react-query';
import { Badge, Panel } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { Legend, LineChart, type Series } from '../revenue/charts';
import shared from '../revenue/page.module.css';
import growth from '../growth/page.module.css';
import Loading from './loading';
import styles from './page.module.css';

interface Health {
  database: { answerMs: number; connections: number; maxConnections: number; sizeMb: number };
  deploy: { commit: string; message: string; branch: string | null; host: string | null } | null;
  recording: boolean;
  passCheck: { endedWaiting: number; suspensionsWaiting: number };
  slowMs: number;
  last30: {
    errors: number;
    slow: number;
    slowAverageMs: number;
    chart: { labels: string[]; errors: number[]; slow: number[] };
    routes: { route: string; errors: number; slow: number; averageMs: number }[];
    latest: { id: string; atLabel: string; kind: 'error' | 'slow'; route: string; status: number; ms: number }[];
  };
  months: { month: string; label: string; errors: number; slow: number }[];
}

/** Errors and slow requests: two of the palette Revenue validated. */
const ERRORS = '#6250d6';
const SLOW = '#255dab';

/** "640 ms", "2.4 s". */
const time = (ms: number) => (ms < 1000 ? `${ms} ms` : `${Number((ms / 1000).toFixed(1))} s`);

export default function HealthPage() {
  const allowed = useInDepartment('devops');
  const data = useQuery({
    queryKey: staffKeys.health,
    queryFn: () => apiGet<Health>('/staff/health'),
    enabled: allowed === true,
    // Read again every minute while open.
    refetchInterval: 60_000,
  });

  // Until it has come, the page's whole skeleton (rule 12).
  if (allowed !== false && !data.data && !data.isError) return <Loading />;
  const now = data.data;

  const behind = now ? now.passCheck.endedWaiting + now.passCheck.suspensionsWaiting : 0;
  const series: Series[] = now
    ? [
        { name: 'Errors', color: ERRORS, values: now.last30.chart.errors },
        { name: 'Slow requests', color: SLOW, values: now.last30.chart.slow },
      ]
    : [];

  return (
    <StaffPage title="Health" meta="How the site is running, and its errors and slow requests over the last 30 days">
      {allowed === false ? (
        <Panel padded>
          <p className={shared.lead}>Only DevOps can see this.</p>
        </Panel>
      ) : data.isError && !now ? (
        <QueryProblem error={data.error} onRetry={() => void data.refetch()} />
      ) : now ? (
        <>
          {now.recording ? null : (
            <p className={shared.testNote} role="status">
              Errors and slow requests are recorded on the live site only. This copy runs on a computer, so none are
              counted here.
            </p>
          )}

          <div className={shared.tiles}>
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Database answer</span>
              <span className={shared.tileValue}>{time(now.database.answerMs)}</span>
              <span className={shared.tileNote}>Just now</span>
            </div>
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Database connections</span>
              <span className={shared.tileValue}>{now.database.connections}</span>
              <span className={shared.tileNote}>Of {now.database.maxConnections} it allows</span>
            </div>
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Database size</span>
              <span className={shared.tileValue}>{now.database.sizeMb} MB</span>
              <span className={shared.tileNote}>Everything stored</span>
            </div>
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Store pass check</span>
              <span className={shared.tileValue}>{behind ? 'Behind' : 'Keeping up'}</span>
              <span className={shared.tileNote}>
                {behind
                  ? [
                      now.passCheck.endedWaiting ? `${now.passCheck.endedWaiting} ended passes waiting` : '',
                      now.passCheck.suspensionsWaiting ? `${now.passCheck.suspensionsWaiting} suspensions not lifted` : '',
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : 'Nothing waiting'}
              </span>
            </div>
          </div>

          <section className={[shared.card, styles.deploy].join(' ')}>
            <h2 className={shared.heading}>Running now</h2>
            {now.deploy ? (
              <p className={styles.deployLine}>
                <span className={styles.commit}>{now.deploy.commit}</span>
                <span>{now.deploy.message || 'No message'}</span>
                <span className={styles.muted}>
                  {[now.deploy.branch && `From ${now.deploy.branch}`, now.deploy.host && `on ${now.deploy.host}`]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </p>
            ) : (
              <p className={styles.muted}>Not a deploy: this copy runs on a computer.</p>
            )}
          </section>

          <h2 className={[shared.heading, growth.gap].join(' ')}>The last 30 days</h2>
          <div className={[shared.tiles, growth.threeTiles].join(' ')}>
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Errors</span>
              <span className={shared.tileValue}>{now.last30.errors}</span>
              <span className={shared.tileNote}>Requests that failed on our side</span>
            </div>
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Slow requests</span>
              <span className={shared.tileValue}>{now.last30.slow}</span>
              <span className={shared.tileNote}>Over {time(now.slowMs)}</span>
            </div>
            <div className={shared.tile}>
              <span className={shared.tileLabel}>Slow requests took</span>
              <span className={shared.tileValue}>{now.last30.slow ? time(now.last30.slowAverageMs) : 'None'}</span>
              <span className={shared.tileNote}>On average</span>
            </div>
          </div>

          <section className={shared.card}>
            <div className={shared.cardHead}>
              <h2 className={shared.heading}>Errors and slow requests by day</h2>
            </div>
            <Legend items={series} line />
            <LineChart labels={now.last30.chart.labels} series={series} label="Errors and slow requests by day" count />
          </section>

          <h2 className={shared.heading}>By route</h2>
          <div className={shared.list}>
            <div className={[shared.headerRow, styles.routeRow].join(' ')} aria-hidden>
              <span>Route</span>
              <span>Errors</span>
              <span>Slow</span>
              <span>Average time</span>
            </div>
            {now.last30.routes.length === 0 ? (
              <div className={shared.none}>
                <p>No errors or slow requests in the last 30 days.</p>
              </div>
            ) : (
              now.last30.routes.map((row) => (
                <div key={row.route} className={[shared.row, styles.routeRow].join(' ')}>
                  <span className={styles.route}>{row.route}</span>
                  <span className={shared.number}>{row.errors}</span>
                  <span className={shared.number}>{row.slow}</span>
                  <span className={shared.number}>{time(row.averageMs)}</span>
                </div>
              ))
            )}
          </div>

          <h2 className={[shared.heading, growth.gap].join(' ')}>The latest</h2>
          <div className={shared.list}>
            <div className={[shared.headerRow, styles.latestRow].join(' ')} aria-hidden>
              <span>When</span>
              <span>Route</span>
              <span>What</span>
              <span>Time</span>
            </div>
            {now.last30.latest.length === 0 ? (
              <div className={shared.none}>
                <p>None recorded yet.</p>
              </div>
            ) : (
              now.last30.latest.map((row) => (
                <div key={row.id} className={[shared.row, styles.latestRow].join(' ')}>
                  <span className={styles.when}>{row.atLabel}</span>
                  <span className={styles.route}>{row.route}</span>
                  <span>
                    {row.kind === 'error' ? (
                      <Badge tone="danger">Error {row.status}</Badge>
                    ) : (
                      <Badge tone="warning">Slow</Badge>
                    )}
                  </span>
                  <span className={shared.number}>{time(row.ms)}</span>
                </div>
              ))
            )}
          </div>

          <h2 className={[shared.heading, growth.gap].join(' ')}>By month</h2>
          <div className={shared.list}>
            <div className={[shared.headerRow, growth.twoRow].join(' ')} aria-hidden>
              <span>Month</span>
              <span>Errors</span>
              <span>Slow</span>
            </div>
            {now.months.map((row) => (
              <div key={row.month} className={[shared.row, growth.twoRow].join(' ')}>
                <span className={shared.strong}>{row.label}</span>
                <span className={shared.number}>{row.errors}</span>
                <span className={shared.number}>{row.slow}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </StaffPage>
  );
}
