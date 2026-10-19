'use client';

/**
 * Tabs — a row of mutually exclusive views, e.g. the listing type on Browse.
 *
 * The active tab is marked by one underline that slides from tab to tab,
 * rather than a line on each tab that blinks on and off. It is measured from
 * the active tab, and re-measured whenever a tab changes size (the active
 * label is bolder, and fonts load late).
 *
 * Measuring needs the browser, so until then the active tab draws the same
 * line itself — in the server's HTML, on the first paint. When the sliding
 * bar is measured, it takes over in the same spot in the same render, so the
 * line is simply there on load and never appears or slides in.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Bone } from '../primitives/Skeleton';
import styles from './Tabs.module.css';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /**
   * A small icon before the label — as the type tabs carry on a phone. Given
   * as a function, it is told whether its tab is the active one, so it can
   * be drawn filled there.
   */
  icon?: ReactNode | ((active: boolean) => ReactNode);
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
  fill = false,
}: {
  tabs: TabItem<T>[];
  active: T;
  onChange: (value: T) => void;
  label: string;
  /**
   * Divide the column evenly between the tabs instead of packing them to the
   * left. For a short, fixed set that reads as a segmented control — the type
   * filter on Browse. Leave it off when the set is long or open-ended,
   * because equal shares would squeeze the labels and hide the fact that the
   * row scrolls.
   */
  fill?: boolean;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  /** No slide on the first placement — only when the active tab changes. */
  const [placed, setPlaced] = useState(false);

  useLayoutEffect(() => {
    const el = row.current;
    if (!el) return;

    const measure = () => {
      const current = el.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!current) return;
      // Sub-pixel, not offsetLeft/offsetWidth, which round: the bar must sit
      // exactly on the tab's own line, which it replaces.
      const tab = current.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      setBar({
        left: tab.left - box.left - el.clientLeft + el.scrollLeft,
        width: tab.width,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    el.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => observer.disconnect();
  }, [active, tabs]);

  useLayoutEffect(() => {
    if (bar && !placed) {
      // Let the first position paint before turning the slide on.
      const frame = requestAnimationFrame(() => setPlaced(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [bar, placed]);

  return (
    <div
      ref={row}
      className={[
        styles.tabs,
        fill ? styles.tabsFill : '',
        bar ? styles.measured : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="tablist"
      aria-label={label}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === active}
          className={[
            styles.tab,
            fill ? styles.tabFill : '',
            tab.value === active ? styles.tabActive : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon ? (
            <span className={styles.withIcon}>
              {typeof tab.icon === 'function'
                ? tab.icon(tab.value === active)
                : tab.icon}
              {tab.label}
            </span>
          ) : (
            tab.label
          )}
        </button>
      ))}

      {bar ? (
        <span
          className={[styles.bar, placed ? styles.barSlides : '']
            .filter(Boolean)
            .join(' ')}
          style={{ width: bar.width, transform: `translateX(${bar.left}px)` }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

/**
 * The tab row while its labels load (they carry counts): the same row and
 * thin rule, a bar where each label will be.
 */
export function TabsSkeleton({
  widths,
  fill = false,
}: {
  /** One bar per tab, about as wide as its label. */
  widths: number[];
  fill?: boolean;
}) {
  return (
    <div
      className={[styles.tabs, fill ? styles.tabsFill : ''].filter(Boolean).join(' ')}
      // The header sits tabs on its edge by this role; hidden from readers.
      role="tablist"
      aria-hidden
    >
      {widths.map((width, i) => (
        <span
          key={i}
          className={[styles.tab, fill ? styles.tabFill : ''].filter(Boolean).join(' ')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: fill ? 'center' : 'flex-start' }}
        >
          <Bone width={width} height={13} />
        </span>
      ))}
    </div>
  );
}
