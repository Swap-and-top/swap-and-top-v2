'use client';

/**
 * Console — Stats: how the store is doing, to decide what to do next.
 *
 * One switch for the stretch of time (today by the hour, a week or a month
 * by the day, a year or all time by the month). Under it the four numbers
 * that follow a sale from first look to done: listing views, number reveals
 * (the leads), offers received and confirmed deals, each with its change on
 * the stretch before. Tap one and the graph shows it; tap or hover a bar
 * for its figure. Then the items doing best, where leads come from, and at
 * the foot sponsored slots, the way to grow these numbers (what Promote used
 * to be; lead alerts live on Leads, and the Friday Drop is paused for now).
 *
 * Confirmed deals are a floor, never a total: they count only when both
 * sides answer the deal check (see docs/features/deal-confirmation.md).
 */

import { useState } from 'react';
import {
  bestItemsFor,
  currentStore,
  dollars,
  mockLeadSources,
  newLeadCount,
  storeStatsFor,
  useConsoleStore,
  useStoreSponsorships,
  type StatsBucket,
  type StatsMetric,
  type StatsRange,
} from '@snt/core';
import {
  Button,
  ButtonLink,
  ConsoleShell,
  Tabs,
  type TabItem,
} from '@snt/ui';
import { MegaphoneIcon, WhatsAppIcon } from '@snt/ui/icons';
import { SponsorSheet } from '@/components/sponsor/SponsorSheet';
import styles from './page.module.css';

const RANGES: TabItem<StatsRange>[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All time', short: 'All' },
];

/** What the graph covers, after its name. */
const SPAN: Record<StatsRange, string> = {
  today: 'today, by the hour',
  week: 'the last 7 days',
  month: 'the last 30 days',
  year: 'the last 12 months',
  all: 'since you joined, by the month',
};

/** The same, without how the graph is split, for the best items. */
const SPAN_PLAIN: Record<StatsRange, string> = {
  today: 'today',
  week: 'the last 7 days',
  month: 'the last 30 days',
  year: 'the last 12 months',
  all: 'since you joined',
};

/** The four numbers, in the order a sale goes. */
const METRICS: {
  value: StatsMetric;
  label: string;
  one: string;
  many: string;
}[] = [
  { value: 'views', label: 'Listing views', one: 'view', many: 'views' },
  { value: 'reveals', label: 'Number reveals', one: 'reveal', many: 'reveals' },
  { value: 'offers', label: 'Offers received', one: 'offer', many: 'offers' },
  { value: 'deals', label: 'Confirmed deals', one: 'deal', many: 'deals' },
];

const count = (n: number) => n.toLocaleString('en-US');

export default function ConsoleStatsPage() {
  const [range, setRange] = useState<StatsRange>('week');
  /** The number the graph shows: the leads, to start. */
  const [metric, setMetric] = useState<StatsMetric>('reveals');
  const stats = storeStatsFor(range);
  const shown = METRICS.find((m) => m.value === metric)!;
  const best = bestItemsFor(currentStore.id, stats.totals).slice(0, 5);
  const whatsapp = Math.round(mockLeadSources.whatsappShare * 100);

  return (
    <ConsoleShell
      store={currentStore}
      title="Stats"
      meta="How your store is doing, and ways to grow it"
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.range}>
          <Tabs
            fill
            tabs={RANGES}
            active={range}
            onChange={setRange}
            label="Stretch of time"
          />
        </div>
      }
    >
      {/* The four numbers; the one tapped is in the graph. */}
      <div className={styles.tiles}>
        {METRICS.map((m) => {
          const now = stats.totals[m.value];
          const before = stats.previous[m.value];
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={metric === m.value}
              className={[styles.tile, metric === m.value ? styles.tileOn : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setMetric(m.value)}
            >
              <span className={styles.tileLabel}>{m.label}</span>
              <span className={styles.tileValue}>{count(now)}</span>
              <Change now={now} before={before} against={stats.against} />
            </button>
          );
        })}
      </div>
      <p className={styles.note}>
        A deal counts once both sides say it went through, so there were at
        least this many.
      </p>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          {shown.label}, {SPAN[range]}
        </h2>
        <BarChart
          // A new stretch or number starts with no bar picked.
          key={`${range}-${metric}`}
          buckets={stats.buckets}
          metric={metric}
          one={shown.one}
          many={shown.many}
          total={stats.totals[metric]}
        />
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Your best items</h2>
        <p className={styles.cardMeta}>
          Most reveals first, {SPAN_PLAIN[range]}
        </p>
        <ol className={styles.items}>
          {best.map((item) => (
            <li key={item.listingId} className={styles.item}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemFigures}>
                {count(item.views)} {item.views === 1 ? 'view' : 'views'} ·{' '}
                {count(item.reveals)}{' '}
                {item.reveals === 1 ? 'reveal' : 'reveals'} · {item.offers}{' '}
                {item.offers === 1 ? 'offer' : 'offers'} · {item.deals}{' '}
                {item.deals === 1 ? 'deal' : 'deals'}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Where leads come from</h2>
        <div className={styles.sources}>
          <div className={styles.source}>
            <span className={[styles.glyph, styles.glyphActive].join(' ')}>
              <WhatsAppIcon size={18} />
            </span>
            <span>
              <strong>{whatsapp}%</strong> of reveals are for WhatsApp, the
              rest for calls
            </span>
          </div>
          <div className={styles.source}>
            <span className={[styles.glyph, styles.glyphAccent].join(' ')}>
              <MegaphoneIcon size={18} weight={1.9} />
            </span>
            <span>
              Sponsored listings get{' '}
              <strong>{mockLeadSources.sponsoredLift}</strong> the reveals of
              the rest
            </span>
          </div>
        </div>
      </section>

      {/* What Promote was: the way to grow the numbers above. */}
      <h2 className={styles.section}>Grow these numbers</h2>
      <SponsoredSlots />
    </ConsoleShell>
  );
}

/** The change on the stretch before, in words: "Up 18% on last week". */
function Change({
  now,
  before,
  against,
}: {
  now: number;
  before: number;
  against: string;
}) {
  if (!against) return <span className={styles.change}>Since you joined</span>;
  if (now === before) {
    return <span className={styles.change}>Same as {against}</span>;
  }
  // On small counts a percentage misleads (one deal to none is "down
  // 100%"): say the earlier count instead.
  if (before < 10) {
    return (
      <span className={styles.change}>
        {against.charAt(0).toUpperCase() + against.slice(1)}: {before}
      </span>
    );
  }
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) {
    return <span className={styles.change}>About the same as {against}</span>;
  }
  return (
    <span
      className={[styles.change, pct > 0 ? styles.up : styles.down].join(' ')}
    >
      {pct > 0 ? 'Up' : 'Down'} {Math.abs(pct)}% on {against}
    </span>
  );
}

/** A round, even number just above the highest bar, for the top line, so
    the bars fill the graph and the middle line is a whole number too. */
function niceTop(max: number): number {
  if (max <= 2) return 2;
  const power = 10 ** Math.floor(Math.log10(max));
  const steps = [1, 1.2, 1.4, 1.6, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const top = steps
    .map((step) => Math.round(step * power))
    .find((value) => value >= max && value % 2 === 0);
  return top ?? 10 * power;
}

/**
 * The graph: one bar for each hour, day or month, on a quiet baseline with
 * a line at the top and the middle. Tap or hover a bar and the line above
 * says its figure; otherwise it gives the total.
 */
function BarChart({
  buckets,
  metric,
  one,
  many,
  total,
}: {
  buckets: StatsBucket[];
  metric: StatsMetric;
  one: string;
  many: string;
  total: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const top = niceTop(Math.max(...buckets.map((b) => b[metric])));
  /** Room for a label under every few bars, not under each. */
  const every = Math.ceil(buckets.length / 7);
  const bucket = picked === null ? null : buckets[picked];

  return (
    <div className={styles.chart}>
      <p className={styles.readout} aria-live="polite">
        {bucket ? (
          <>
            <strong>
              {count(bucket[metric])} {bucket[metric] === 1 ? one : many}
            </strong>{' '}
            · {bucket.label}
          </>
        ) : (
          <>
            <strong>
              {count(total)} {total === 1 ? one : many}
            </strong>{' '}
            in all · tap a bar for its figure
          </>
        )}
      </p>

      <div className={styles.plot} onMouseLeave={() => setPicked(null)}>
        {/* The scale: a line at the top and the middle, numbered. */}
        <span className={styles.grid} style={{ bottom: '100%' }}>
          <span className={styles.gridLabel}>{count(top)}</span>
        </span>
        <span className={styles.grid} style={{ bottom: '50%' }}>
          <span className={styles.gridLabel}>{count(top / 2)}</span>
        </span>

        <div className={styles.bars}>
          {buckets.map((b, i) => (
            <button
              key={b.label}
              type="button"
              className={[styles.barSlot, picked === i ? styles.barPicked : '']
                .filter(Boolean)
                .join(' ')}
              aria-label={`${b.label}: ${b[metric]} ${b[metric] === 1 ? one : many}`}
              onMouseEnter={() => setPicked(i)}
              onFocus={() => setPicked(i)}
              onClick={() => setPicked(picked === i ? null : i)}
            >
              <span
                className={styles.bar}
                style={{ height: `${(b[metric] / top) * 100}%` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Under the bars: a label every few, so they never crowd. */}
      <div className={styles.axis} aria-hidden>
        {buckets.map((b, i) => (
          <span key={b.label} className={styles.tick}>
            {i % every === 0 ? b.short : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Sponsored slots: what they are and cost, how many items run now and at
 * what a day, a way to them in Stock (Boosted listings, Stock's Boosted
 * tab, where each is extended or stopped), and a button to boost another. Lead alerts live on Leads, with their settings.
 */
function SponsoredSlots() {
  // The store's own: other people sponsor their listings too.
  const sponsorships = useStoreSponsorships(currentStore.id);
  const setStockTab = useConsoleStore((state) => state.setStockTab);
  /** The Sponsor sheet, to pick an item and sponsor it. */
  const [sheet, setSheet] = useState(false);
  const perDay = sponsorships.reduce((sum, s) => sum + s.dailyBudget, 0);

  return (
    <div className={styles.product}>
      <span className={[styles.glyph, styles.glyphAccent].join(' ')}>
        <MegaphoneIcon size={18} weight={1.9} />
      </span>
      <div className={styles.body}>
        <span className={styles.name}>Boosts</span>
        <p className={styles.description}>
          Your listing shows in a labelled Sponsored slot in the feed, from $1
          a day. The more a day, the more people see it. Paid through Paynow.
        </p>
        <p className={styles.runningSummary}>
          {sponsorships.length > 0
            ? `${sponsorships.length} ${sponsorships.length === 1 ? 'listing' : 'listings'} boosted now · ${dollars(perDay)} a day`
            : 'Nothing boosted right now'}
        </p>

        <div className={styles.actions}>
          <Button size="sm" onClick={() => setSheet(true)}>
            Boost a listing
          </Button>
          {sponsorships.length > 0 ? (
            <ButtonLink
              href="/console/stock"
              variant="secondary"
              size="sm"
              // Stock, on its Boosted tab: extend or stop each there.
              onClick={() => setStockTab('boosted')}
            >
              Boosted listings
            </ButtonLink>
          ) : null}
        </div>
      </div>

      {sheet ? <SponsorSheet onClose={() => setSheet(false)} /> : null}
    </div>
  );
}
