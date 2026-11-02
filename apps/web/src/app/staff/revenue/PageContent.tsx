'use client';

/**
 * Revenue, the Finance section of the Staff console (GET /api/staff/revenue):
 * a day, a week, a month or a year at a time, beside another of the same
 * length. One row of controls scopes everything under it: the length (small
 * pills), which one, Compare (on at first) with which (the one before at
 * first, or any other: last year's same month, say), and Include test
 * payments (on while no real payment has been made; the page says plainly
 * when they are counted). Then
 * four tiles with the change on the period before; revenue over time as
 * columns or a line (this period green, the one before blue); revenue by
 * product as a donut or bars; and the period's payments under one filter.
 * A Finance leader downloads the period as a spreadsheet
 * (GET /api/staff/revenue/export), each download logged. Look only.
 */

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Chip, ChipRow, Dropdown, Panel, type BadgeTone } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { useLoadingBar } from '@/lib/loadingBar';
import { useInDepartment } from '@/lib/staff';
import { Pager, usePageSize } from '../Pager';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { BarChart, ColumnChart, DonutChart, Legend, LineChart, money, type Series } from './charts';
import Loading from './loading';
import styles from './page.module.css';

type Unit = 'day' | 'week' | 'month' | 'year';
type Show = 'all' | 'paid' | 'failed' | 'pending' | 'test';
type Status = 'pending' | 'paid' | 'failed' | 'cancelled';

interface Row {
  id: string;
  atLabel: string;
  payer: string;
  store?: string;
  product: string;
  amount: number;
  currency: string;
  status: Status;
  test: boolean;
  reference?: string;
}

interface Totals {
  revenue: number;
  paid: number;
  failed: number;
  pending: number;
}

interface Period {
  unit: Unit;
  period: string;
  label: string;
  against: string;
  previousLabel: string;
  periods: { value: string; label: string }[];
  includeTest: boolean;
  hasReal: boolean;
  totals: { current: Totals; previous: Totals };
  chart: { labels: string[]; current: number[]; previous: number[] };
  byProduct: { product: string; revenue: number; previous: number; count: number }[];
  counts: Record<Show, number>;
  rows: Row[];
  total: number;
  canExport: boolean;
  page: number;
}

/** This period and the one before: the app's brand green and blue,
    checked with the palette validator (CVD and normal vision pass). */
const CURRENT = '#1cb67f';
const PREVIOUS = '#255dab';
/** The four products, in a fixed order, validated together. */
const PRODUCT_COLORS = ['#255dab', '#1cb67f', '#eda100', '#6250d6'];

const UNIT_LABEL: Record<Unit, string> = { day: 'day', week: 'week', month: 'month', year: 'year' };
const UNITS: Unit[] = ['day', 'week', 'month', 'year'];

const SHOW_LABELS: Record<Show, string> = {
  all: 'All payments',
  paid: 'Paid',
  failed: 'Failed',
  pending: 'Pending',
  test: 'Test payments',
};

const STATUS: Record<Status, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/** One cell of a spreadsheet, quoted when it needs to be. */
const cell = (value: string | number | undefined) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** "Up $4 on Sep 2026", "Down 2 on ...", "Same as ...". */
function change(now: number, before: number, label: string, asMoney: boolean) {
  const diff = now - before;
  const shown = asMoney ? money(Math.abs(diff)) : String(Math.abs(diff));
  return diff === 0 ? `Same as ${label}` : `${diff > 0 ? 'Up' : 'Down'} ${shown} on ${label}`;
}

export default function RevenuePage() {
  const allowed = useInDepartment('finance');
  const periodLabel = useId();
  const againstLabel = useId();
  const showLabel = useId();
  const [unit, setUnit] = useState<Unit>('month');
  /** None until chosen: the current one. */
  const [period, setPeriod] = useState<string | undefined>();
  const [compare, setCompare] = useState(true);
  /** None until chosen: the one before. */
  const [against, setAgainst] = useState<string | undefined>();
  /** None until chosen: the API's own default. */
  const [test, setTest] = useState<boolean | undefined>();
  const [overTime, setOverTime] = useState<'columns' | 'line'>('columns');
  const [byProduct, setByProduct] = useState<'donut' | 'bars'>('donut');
  const [show, setShow] = useState<Show>('all');
  const [page, setPage] = useState(1);
  const [size, setSize] = usePageSize('snt-revenue-size');

  const data = useQuery({
    queryKey: [...staffKeys.revenue, { unit, period, against, test, show, page, size }],
    queryFn: () => {
      const params = new URLSearchParams({ unit, show, page: String(page), size });
      if (period) params.set('period', period);
      if (against) params.set('against', against);
      if (test !== undefined) params.set('test', test ? '1' : '0');
      return apiGet<Omit<Period, 'page'>>(`/staff/revenue?${params}`).then((answer) => ({ ...answer, page }));
    },
    enabled: allowed === true,
    // What is on show stays, faded, while the next comes.
    placeholderData: keepPreviousData,
  });

  // New figures on the way (another period, or a filter): the top bar runs.
  useLoadingBar(data.isPlaceholderData);

  const download = useMutation({
    mutationFn: (now: Period) => apiGet<{ rows: Row[] }>(`/staff/revenue/export?unit=${now.unit}&period=${now.period}`),
    onSuccess: ({ rows }, now) => {
      const head = ['When', 'Paid by', 'Store', 'Product', 'Amount', 'Currency', 'Status', 'Test', 'Paynow reference'];
      const lines = rows.map((row) =>
        [row.atLabel, row.payer, row.store, row.product, row.amount, row.currency, STATUS[row.status].label, row.test ? 'Yes' : 'No', row.reference]
          .map(cell)
          .join(','),
      );
      const url = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Swap and Top payments, ${now.label}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('The payments have been downloaded.');
    },
    onError: (error) => toast.error(error.message),
  });

  // Until the period has come, the page's whole skeleton (rule 12).
  if (allowed !== false && !data.data && !data.isError) return <Loading />;
  const now = data.data;

  const timeSeries: Series[] = now
    ? [
        { name: now.label, color: CURRENT, values: now.chart.current },
        ...(compare ? [{ name: now.previousLabel, color: PREVIOUS, values: now.chart.previous }] : []),
      ]
    : [];

  return (
    <StaffPage
      title="Revenue"
      meta="Store passes and boosts, a day, a week, a month or a year at a time"
      actions={
        now ? (
          <div className={styles.controls}>
            <ChipRow label="A day, a week, a month or a year">
              {UNITS.map((value) => (
                <Chip
                  key={value}
                  selected={unit === value}
                  onClick={() => {
                    setUnit(value);
                    setPeriod(undefined);
                    setAgainst(undefined);
                    setPage(1);
                  }}
                >
                  {UNIT_LABEL[value][0]!.toUpperCase() + UNIT_LABEL[value].slice(1)}
                </Chip>
              ))}
            </ChipRow>
            <span id={periodLabel} hidden>
              Which {UNIT_LABEL[unit]}
            </span>
            <Dropdown<string>
              value={now.period}
              options={now.periods}
              onChange={(value) => {
                setPeriod(value);
                // Compared with the one before the newly chosen, until
                // another is chosen.
                setAgainst(undefined);
                setPage(1);
              }}
              labelledBy={periodLabel}
              className={styles.filter}
            />
            <Chip selected={compare} onClick={() => setCompare(!compare)}>
              Compare
            </Chip>
            {compare ? (
              <>
                <span id={againstLabel} hidden>
                  Compare with
                </span>
                <Dropdown<string>
                  value={now.against}
                  options={now.periods
                    .filter((option) => option.value !== now.period)
                    .map((option) => ({ ...option, label: `With ${option.label}` }))}
                  onChange={setAgainst}
                  labelledBy={againstLabel}
                  className={styles.filter}
                />
              </>
            ) : null}
            <Chip
              selected={now.includeTest}
              onClick={() => {
                setTest(!now.includeTest);
                setPage(1);
              }}
            >
              Include test payments
            </Chip>
            {now.canExport ? (
              <Button variant="secondary" size="sm" loading={download.isPending} onClick={() => download.mutate(now)}>
                Download as a spreadsheet
              </Button>
            ) : null}
          </div>
        ) : null
      }
    >
      {allowed === false ? (
        <Panel padded>
          <p className={styles.lead}>Only Finance can see this.</p>
        </Panel>
      ) : data.isError && !now ? (
        <QueryProblem error={data.error} onRetry={() => void data.refetch()} />
      ) : now ? (
        <div className={data.isPlaceholderData ? styles.loading : undefined} aria-busy={data.isPlaceholderData || undefined}>
          {now.includeTest ? (
            <p className={styles.testNote} role="status">
              Test payments are counted here. They are not real money: Paynow is not set up yet.
            </p>
          ) : null}

          <div className={styles.tiles}>
            {(
              [
                ['Revenue', now.totals.current.revenue, now.totals.previous.revenue, true],
                ['Paid payments', now.totals.current.paid, now.totals.previous.paid, false],
                ['Failed', now.totals.current.failed, now.totals.previous.failed, false],
                ['Pending', now.totals.current.pending, now.totals.previous.pending, false],
              ] as const
            ).map(([label, value, before, asMoney]) => (
              <div key={label} className={styles.tile}>
                <span className={styles.tileLabel}>{label}</span>
                <span className={styles.tileValue}>{asMoney ? money(value) : value}</span>
                {compare ? <span className={styles.tileNote}>{change(value, before, now.previousLabel, asMoney)}</span> : null}
              </div>
            ))}
          </div>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.heading}>Revenue over time</h2>
              <ChipRow label="Show as bars or a line">
                <Chip selected={overTime === 'columns'} onClick={() => setOverTime('columns')}>
                  Bars
                </Chip>
                <Chip selected={overTime === 'line'} onClick={() => setOverTime('line')}>
                  Line
                </Chip>
              </ChipRow>
            </div>
            <Legend items={timeSeries} line={overTime === 'line'} />
            {overTime === 'columns' ? (
              <ColumnChart labels={now.chart.labels} series={timeSeries} label={`Revenue for ${now.label}`} />
            ) : (
              <LineChart labels={now.chart.labels} series={timeSeries} label={`Revenue for ${now.label}`} />
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.heading}>Revenue by product</h2>
              <ChipRow label="Show as a pie or bars">
                <Chip selected={byProduct === 'donut'} onClick={() => setByProduct('donut')}>
                  Pie
                </Chip>
                <Chip selected={byProduct === 'bars'} onClick={() => setByProduct('bars')}>
                  Bars
                </Chip>
              </ChipRow>
            </div>
            {byProduct === 'donut' ? (
              <DonutChart
                label={`Revenue by product for ${now.label}`}
                slices={now.byProduct.map((row, n) => ({
                  name: row.product,
                  color: PRODUCT_COLORS[n] ?? CURRENT,
                  value: row.revenue,
                }))}
              />
            ) : (
              <>
                <Legend
                  items={[
                    { name: now.label, color: CURRENT },
                    ...(compare ? [{ name: now.previousLabel, color: PREVIOUS }] : []),
                  ]}
                />
                <BarChart
                  label={`Revenue by product for ${now.label}`}
                  rows={now.byProduct.map((row) => row.product)}
                  series={[
                    { name: now.label, color: CURRENT, values: now.byProduct.map((row) => row.revenue) },
                    ...(compare
                      ? [{ name: now.previousLabel, color: PREVIOUS, values: now.byProduct.map((row) => row.previous) }]
                      : []),
                  ]}
                />
              </>
            )}
          </section>

          {/* The same figures as a table, so none rests on colour or hover. */}
          <div className={styles.list}>
            <div className={[styles.headerRow, styles.productRow].join(' ')} aria-hidden>
              <span>Product</span>
              <span>Sold</span>
              <span>{now.label}</span>
              {compare ? <span>{now.previousLabel}</span> : <span />}
            </div>
            {now.byProduct.map((row) => (
              <div key={row.product} className={[styles.row, styles.productRow].join(' ')}>
                <span className={styles.strong}>{row.product}</span>
                <span className={styles.number}>{row.count}</span>
                <span className={styles.number}>{money(row.revenue)}</span>
                {compare ? <span className={styles.number}>{money(row.previous)}</span> : <span />}
              </div>
            ))}
          </div>

          <div className={styles.paymentsHead}>
            <h2 className={styles.heading}>Payments, {now.label}</h2>
            <span id={showLabel} hidden>
              Show
            </span>
            <Dropdown<Show>
              value={show}
              options={(Object.keys(SHOW_LABELS) as Show[]).map((value) => ({
                value,
                label: SHOW_LABELS[value],
                count: now.counts[value],
              }))}
              onChange={(value) => {
                setShow(value);
                setPage(1);
              }}
              labelledBy={showLabel}
              className={styles.filter}
            />
          </div>
          <div className={styles.list}>
            <div className={[styles.headerRow, styles.paymentRow].join(' ')} aria-hidden>
              <span>When</span>
              <span>Paid by</span>
              <span>Store</span>
              <span>Product</span>
              <span>Amount</span>
              <span />
            </div>
            {now.rows.length === 0 ? (
              <div className={styles.none}>
                <p>{show === 'all' ? `No payments in ${now.label}.` : `No ${SHOW_LABELS[show].toLowerCase()} in ${now.label}.`}</p>
              </div>
            ) : (
              now.rows.map((row) => (
                <div key={row.id} className={[styles.row, styles.paymentRow].join(' ')}>
                  <span className={styles.when}>{row.atLabel}</span>
                  <span className={styles.payer}>{row.payer}</span>
                  <span className={styles.store}>{row.store ?? 'None'}</span>
                  <span className={styles.product}>{row.product}</span>
                  <span className={styles.amount}>{money(row.amount)}</span>
                  <span className={styles.status}>
                    {row.test ? <Badge tone="warning">Test</Badge> : null}
                    <Badge tone={STATUS[row.status].tone}>{STATUS[row.status].label}</Badge>
                  </span>
                </div>
              ))
            )}
          </div>
          {now.total > 0 ? (
            <Pager
              shown={now.page}
              total={now.total}
              size={size}
              loading={data.isPlaceholderData}
              what="Payments"
              onPage={setPage}
              onSize={(value) => {
                setSize(value);
                setPage(1);
              }}
            />
          ) : null}
        </div>
      ) : null}
    </StaffPage>
  );
}
