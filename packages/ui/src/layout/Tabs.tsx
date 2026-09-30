'use client';

/**
 * Tabs — a row of mutually exclusive views, e.g. the listing type on Browse.
 *
 * The active tab is marked by one underline that slides from tab to tab,
 * rather than a line on each tab that blinks on and off. It is measured from
 * the active tab, and re-measured whenever a tab changes size (the active
 * label is bolder, and fonts load late).
 */

import { useLayoutEffect, useRef, useState } from 'react';
import styles from './Tabs.module.css';

export interface TabItem<T extends string> {
  value: T;
  label: string;
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
      setBar({ left: current.offsetLeft, width: current.offsetWidth });
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
      className={[styles.tabs, fill ? styles.tabsFill : ''].filter(Boolean).join(' ')}
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
          {tab.label}
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
