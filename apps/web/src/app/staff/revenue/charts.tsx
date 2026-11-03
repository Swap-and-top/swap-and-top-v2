'use client';

/**
 * Revenue's charts, drawn in SVG to the data viz method (the dataviz skill):
 * thin marks (columns at most 24px with 4px rounded tops, 2px lines, 8px
 * end dots ringed in the surface), hairline gridlines, clean rounded axis
 * ticks, a legend for two or more series, text in the text inks (never the
 * series colour), and a hover readout on every chart (a crosshair on time,
 * the mark itself on a donut or bar). Every value is also in the tables
 * under them. Colours are passed in; see SERIES in PageContent.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './charts.module.css';

export interface Series {
  name: string;
  color: string;
  values: number[];
}

/** "$15", "$1.5K". */
export const money = (amount: number) =>
  amount >= 1000 ? `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K` : `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

/** The chart's own width, followed as it changes. A listener, not loading. */
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setWidth(el.clientWidth));
    watch.observe(el);
    setWidth(el.clientWidth);
    return () => watch.disconnect();
  }, []);
  return [box, width];
}

/** A clean top for the axis, and its ticks: 0, then even steps (whole ones
    for a count, which has no halves). */
function niceScale(max: number, whole = false): number[] {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? rough;
  const step = whole ? Math.max(1, Math.ceil(nice)) : nice;
  return Array.from({ length: 5 }, (_, n) => n * step);
}

/** The legend: one key per series, its mark beside plain text. */
export function Legend({ items, line = false }: { items: { name: string; color: string }[]; line?: boolean }) {
  if (items.length < 2) return null;
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.name}>
          <span className={line ? styles.keyLine : styles.keySwatch} style={{ background: item.color }} aria-hidden />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/** The readout over a chart: values first, each series keyed by a short line. */
function Tip({ x, y, title, rows }: { x: number; y: number; title: string; rows: { name: string; color: string; value: string }[] }) {
  return (
    <div className={styles.tip} style={{ left: x, top: y }} role="status">
      <span className={styles.tipTitle}>{title}</span>
      {rows.map((row) => (
        <span key={row.name} className={styles.tipRow}>
          <span className={styles.tipKey} style={{ background: row.color }} aria-hidden />
          <strong>{row.value}</strong>
          <span className={styles.tipName}>{row.name}</span>
        </span>
      ))}
    </div>
  );
}

const PAD = { top: 12, right: 12, bottom: 28, left: 44 };
const HEIGHT = 240;

/** The frame both time charts share: gridlines, ticks and every few labels. */
function TimeFrame({
  width,
  labels,
  ticks,
  format = money,
  children,
}: {
  width: number;
  labels: string[];
  ticks: number[];
  /** How a tick reads: money, unless a count. */
  format?: (value: number) => string;
  children: ReactNode;
}) {
  const inner = width - PAD.left - PAD.right;
  const plot = HEIGHT - PAD.top - PAD.bottom;
  const top = ticks[ticks.length - 1] ?? 1;
  const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(inner / 56))));
  const band = inner / labels.length;
  return (
    <>
      {ticks.map((tick) => {
        const y = PAD.top + plot - (tick / top) * plot;
        return (
          <g key={tick}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y} y2={y} className={styles.grid} />
            <text x={PAD.left - 8} y={y} className={styles.tick} textAnchor="end" dominantBaseline="middle">
              {format(tick)}
            </text>
          </g>
        );
      })}
      {labels.map((label, n) =>
        n % every === 0 ? (
          <text key={label} x={PAD.left + band * n + band / 2} y={HEIGHT - 8} className={styles.tick} textAnchor="middle">
            {label}
          </text>
        ) : null,
      )}
      {children}
    </>
  );
}

/** Revenue over time as columns: this period beside the one before. */
export function ColumnChart({ labels, series, label }: { labels: string[]; series: Series[]; label: string }) {
  const [box, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const ticks = niceScale(Math.max(0, ...series.flatMap((s) => s.values)));
  const top = ticks[ticks.length - 1] ?? 1;
  const inner = width - PAD.left - PAD.right;
  const plot = HEIGHT - PAD.top - PAD.bottom;
  const band = inner / labels.length;
  const gap = 2;
  const bar = Math.max(2, Math.min(24, (band * 0.7 - gap * (series.length - 1)) / series.length));
  const group = bar * series.length + gap * (series.length - 1);
  return (
    <div ref={box} className={styles.chart}>
      <svg width={width} height={HEIGHT} role="img" aria-label={label}>
        <TimeFrame width={width} labels={labels} ticks={ticks}>
          {labels.map((name, n) => {
            const x0 = PAD.left + band * n + (band - group) / 2;
            return (
              <g key={name}>
                {series.map((s, k) => {
                  const value = s.values[n] ?? 0;
                  const h = (value / top) * plot;
                  if (h <= 0) return null;
                  const x = x0 + k * (bar + gap);
                  const y = PAD.top + plot - h;
                  const r = Math.min(4, bar / 2, h);
                  // Rounded at the top, square at the baseline.
                  const d = `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + bar - r} Q${x + bar},${y} ${x + bar},${y + r} V${y + h} Z`;
                  return <path key={s.name} d={d} fill={s.color} opacity={hover === null || hover === n ? 1 : 0.55} />;
                })}
                {/* The whole band is the place to hover or focus. */}
                <rect
                  x={PAD.left + band * n}
                  y={PAD.top}
                  width={band}
                  height={plot}
                  fill="transparent"
                  tabIndex={0}
                  onPointerEnter={() => setHover(n)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(n)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </TimeFrame>
      </svg>
      {hover !== null ? (
        <Tip
          x={Math.min(width - 150, PAD.left + band * hover + band / 2 + 8)}
          y={PAD.top}
          title={labels[hover] ?? ''}
          rows={series.map((s) => ({ name: s.name, color: s.color, value: money(s.values[hover] ?? 0) }))}
        />
      ) : null}
    </div>
  );
}

/** Revenue over time as lines, with a crosshair that finds the day. With
    `count`, the values are counts (the Overview's), not money. */
export function LineChart({
  labels,
  series,
  label,
  count = false,
}: {
  labels: string[];
  series: Series[];
  label: string;
  count?: boolean;
}) {
  const [box, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const format = count ? String : money;
  const ticks = niceScale(Math.max(0, ...series.flatMap((s) => s.values)), count);
  const top = ticks[ticks.length - 1] ?? 1;
  const inner = width - PAD.left - PAD.right;
  const plot = HEIGHT - PAD.top - PAD.bottom;
  const band = inner / labels.length;
  const xOf = (n: number) => PAD.left + band * n + band / 2;
  const yOf = (value: number) => PAD.top + plot - (value / top) * plot;
  return (
    <div ref={box} className={styles.chart}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={label}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const n = Math.floor((event.clientX - rect.left - PAD.left) / band);
          setHover(n >= 0 && n < labels.length ? n : null);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <TimeFrame width={width} labels={labels} ticks={ticks} format={format}>
          {hover !== null ? (
            <line x1={xOf(hover)} x2={xOf(hover)} y1={PAD.top} y2={PAD.top + plot} className={styles.crosshair} />
          ) : null}
          {/* The one before first, so this period's line sits on top. */}
          {[...series].reverse().map((s) => (
            <g key={s.name}>
              <polyline
                points={labels.map((_, n) => `${xOf(n)},${yOf(s.values[n] ?? 0)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* The end, and the day pointed at: a dot ringed in the surface. */}
              {[labels.length - 1, ...(hover !== null ? [hover] : [])].map((n) => (
                <circle key={n} cx={xOf(n)} cy={yOf(s.values[n] ?? 0)} r={4} fill={s.color} className={styles.ring} />
              ))}
            </g>
          ))}
        </TimeFrame>
      </svg>
      {hover !== null ? (
        <Tip
          x={Math.min(width - 150, xOf(hover) + 10)}
          y={PAD.top}
          title={labels[hover] ?? ''}
          rows={series.map((s) => ({ name: s.name, color: s.color, value: format(s.values[hover] ?? 0) }))}
        />
      ) : null}
    </div>
  );
}

/** Part of the whole: a donut, each slice parted by the surface. */
export function DonutChart({
  slices,
  label,
}: {
  slices: { name: string; color: string; value: number }[];
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const size = 200;
  const outer = 96;
  const inner = 60;
  const c = size / 2;
  let angle = -Math.PI / 2;
  const arcs = slices.map((s, n) => {
    const sweep = total ? (s.value / total) * Math.PI * 2 : 0;
    const a0 = angle;
    const a1 = angle + sweep;
    angle = a1;
    if (sweep <= 0) return null;
    const full = sweep >= Math.PI * 2 - 1e-6;
    const p = (r: number, a: number) => `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
    const large = sweep > Math.PI ? 1 : 0;
    const d = full
      ? `M${c - outer},${c} a${outer},${outer} 0 1,0 ${outer * 2},0 a${outer},${outer} 0 1,0 ${-outer * 2},0 M${c - inner},${c} a${inner},${inner} 0 1,1 ${inner * 2},0 a${inner},${inner} 0 1,1 ${-inner * 2},0`
      : `M${p(outer, a0)} A${outer},${outer} 0 ${large},1 ${p(outer, a1)} L${p(inner, a1)} A${inner},${inner} 0 ${large},0 ${p(inner, a0)} Z`;
    return (
      <path
        key={s.name}
        d={d}
        fill={s.color}
        fillRule="evenodd"
        className={styles.slice}
        opacity={hover === null || hover === n ? 1 : 0.55}
        tabIndex={0}
        onPointerEnter={() => setHover(n)}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setHover(n)}
        onBlur={() => setHover(null)}
      />
    );
  });
  const shown = hover !== null ? slices[hover] : null;
  return (
    <div className={styles.donut}>
      <svg width={size} height={size} role="img" aria-label={label}>
        {total ? arcs : <circle cx={c} cy={c} r={(outer + inner) / 2} fill="none" strokeWidth={outer - inner} className={styles.empty} />}
        <text x={c} y={c - 6} textAnchor="middle" className={styles.donutValue}>
          {money(shown ? shown.value : total)}
        </text>
        <text x={c} y={c + 14} textAnchor="middle" className={styles.tick}>
          {shown ? `${total ? Math.round((shown.value / total) * 100) : 0}% of it` : 'In all'}
        </text>
      </svg>
      {/* The legend carries each slice's name and value. */}
      <ul className={styles.donutLegend}>
        {slices.map((s) => (
          <li key={s.name}>
            <span className={styles.keySwatch} style={{ background: s.color }} aria-hidden />
            <span className={styles.donutName}>{s.name}</span>
            <strong>{money(s.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Product by product, as bars: this period, and the one before beneath. */
export function BarChart({
  rows,
  series,
  label,
}: {
  rows: string[];
  series: Series[];
  label: string;
}) {
  const [box, width] = useWidth();
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(0, ...series.flatMap((s) => s.values)) || 1;
  const nameW = Math.min(170, width * 0.38);
  const valueW = 56;
  const track = Math.max(40, width - nameW - valueW - 16);
  const bar = 14;
  const gap = 2;
  const rowH = series.length * bar + (series.length - 1) * gap + 18;
  return (
    <div ref={box} className={styles.chart}>
      <svg width={width} height={rows.length * rowH} role="img" aria-label={label}>
        {rows.map((name, n) => {
          const y0 = n * rowH + 9;
          return (
            <g key={name}>
              <text x={0} y={y0 + (series.length * (bar + gap)) / 2} dominantBaseline="middle" className={styles.barName}>
                {name}
              </text>
              {series.map((s, k) => {
                const value = s.values[n] ?? 0;
                const w = (value / max) * track;
                const y = y0 + k * (bar + gap);
                const r = Math.min(4, w / 2, bar / 2);
                const d = `M${nameW},${y} H${nameW + w - r} Q${nameW + w},${y} ${nameW + w},${y + r} V${y + bar - r} Q${nameW + w},${y + bar} ${nameW + w - r},${y + bar} H${nameW} Z`;
                const key = `${name}-${s.name}`;
                return (
                  <g key={s.name}>
                    {w > 0 ? <path d={d} fill={s.color} opacity={hover === null || hover === key ? 1 : 0.55} /> : null}
                    <text x={nameW + w + 6} y={y + bar / 2} dominantBaseline="middle" className={styles.tick}>
                      {money(value)}
                    </text>
                    <rect
                      x={nameW}
                      y={y - 1}
                      width={track}
                      height={bar + 2}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${name}, ${s.name}: ${money(value)}`}
                      onPointerEnter={() => setHover(key)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(key)}
                      onBlur={() => setHover(null)}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
