'use client';

/**
 * The three Leads tabs as a segmented switch: a pale blue strip, each tab
 * its name and its count in a small white round. The tab on show sits on a
 * block of the blue that slides across to the tab tapped, rather than
 * jumping, its name turning white as the blue arrives. On a phone the names
 * shorten to fit.
 *
 * The counts are totals, not news, so they are not red: red is kept for
 * what is new and waiting (as on the bottom bar's Leads and Swaps).
 */

import { useLayoutEffect, useRef, useState } from 'react';
import type { LeadTab } from '@snt/core';
import styles from './LeadTabs.module.css';

const TABS: { value: LeadTab; label: string; short: string }[] = [
  { value: 'matching', label: 'Matching requests', short: 'Matching' },
  { value: 'reveals', label: 'Number reveals', short: 'Reveals' },
  { value: 'offers', label: 'Offers sent', short: 'Offers' },
];

export function LeadTabs({
  active,
  counts,
  onChange,
}: {
  active: LeadTab;
  counts: Record<LeadTab, number>;
  onChange: (tab: LeadTab) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  /** Where the blue block sits: over the tab on show. */
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(
    null,
  );
  /** Whether the block slides to its place: only when a tab is chosen,
      not when it is first placed or the strip changes size. */
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
    // A turned phone or a resized window: follow at once, no slide. The
    // watcher reports once as it starts; that is not a resize, so it is
    // let pass, or it would stop the slide just begun.
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
  }, [active]);

  return (
    <div ref={strip} className={styles.switch} role="tablist" aria-label="Leads">
      {thumb ? (
        <span
          className={[styles.thumb, slide ? styles.slides : '']
            .filter(Boolean)
            .join(' ')}
          style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
          aria-hidden
        />
      ) : null}
      {TABS.map((tab) => {
        const on = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={on}
            className={[styles.tab, on ? styles.on : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(tab.value)}
          >
            <span className={styles.label}>{tab.label}</span>
            <span className={styles.short} aria-hidden>
              {tab.short}
            </span>
            <span className={styles.count}>{counts[tab.value]}</span>
          </button>
        );
      })}
    </div>
  );
}
