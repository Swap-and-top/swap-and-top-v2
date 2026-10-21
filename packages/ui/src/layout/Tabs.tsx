'use client';

/**
 * Tabs — a row of mutually exclusive views, e.g. the listing type on Browse,
 * as a segmented switch: a pale blue strip, each tab its name (and an icon,
 * and a count in a small round, where given). The tab on show sits on a block
 * of the blue that slides across to the tab tapped, rather than jumping, its
 * name turning white as the blue arrives.
 *
 * The block is measured from the tab on show, and followed as the strip
 * changes size. Until it is measured — in the server's HTML, on the first
 * paint — the tab on show fills itself with the same blue, so the switch is
 * simply there on load; the block takes over in the same spot. It slides only
 * when a tab is chosen, never on load or on a resize.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Bone } from '../primitives/Skeleton';
import styles from './Tabs.module.css';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** A shorter name for a phone, where the full one would not fit. */
  short?: string;
  /** A count, shown after the name in a small round. */
  count?: number;
  /**
   * A small icon before the name. Given as a function, it is told whether
   * its tab is the one on show.
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
   * Divide the width evenly between the tabs, the strip spanning the column.
   * For a short, fixed set. Leave it off when the set is long or open ended:
   * the strip is then as wide as its tabs, and scrolls if they overflow.
   */
  fill?: boolean;
}) {
  const strip = useRef<HTMLDivElement>(null);
  /** Where the blue block sits: over the tab on show. */
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(
    null,
  );
  /** Whether it slides to its place: only when a tab is chosen. */
  const [slide, setSlide] = useState(false);
  const shown = useRef(active);

  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const place = () => {
      const tab = el.querySelector<HTMLElement>('[aria-selected="true"]');
      if (tab) setThumb({ left: tab.offsetLeft, width: tab.offsetWidth });
    };
    // A tab chosen: slide there. First placed: just be there.
    setSlide(shown.current !== active);
    shown.current = active;
    place();
    // A turned phone, a resized window, a late font: follow at once. The
    // watcher reports once as it starts; that is let pass, or it would stop
    // the slide just begun.
    let started = false;
    const watcher = new ResizeObserver(() => {
      if (!started) {
        started = true;
        return;
      }
      setSlide(false);
      place();
    });
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [active, tabs]);

  return (
    <div
      ref={strip}
      className={[
        styles.tabs,
        fill ? styles.tabsFill : '',
        thumb ? styles.measured : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="tablist"
      aria-label={label}
    >
      {thumb ? (
        <span
          className={[styles.thumb, slide ? styles.slides : '']
            .filter(Boolean)
            .join(' ')}
          style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
          aria-hidden
        />
      ) : null}
      {tabs.map((tab) => {
        const on = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={on}
            className={[
              styles.tab,
              fill ? styles.tabFill : '',
              on ? styles.tabActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(tab.value)}
          >
            {tab.icon ? (
              <span className={styles.icon}>
                {typeof tab.icon === 'function' ? tab.icon(on) : tab.icon}
              </span>
            ) : null}
            {tab.short ? (
              <>
                <span className={styles.label}>{tab.label}</span>
                <span className={styles.short} aria-hidden>
                  {tab.short}
                </span>
              </>
            ) : (
              <span>{tab.label}</span>
            )}
            {tab.count !== undefined ? (
              <span className={styles.count}>{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The tabs while their names load (they carry counts): the same pale strip,
 * a bar where each name will be.
 */
export function TabsSkeleton({
  widths,
  fill = false,
}: {
  /** One bar per tab, about as wide as its name. */
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
        >
          <Bone width={width} height={13} />
        </span>
      ))}
    </div>
  );
}
