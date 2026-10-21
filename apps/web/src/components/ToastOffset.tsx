'use client';

/**
 * Keeps toasts clear of a bar fixed to the bottom of a phone screen, and no
 * higher than that. Any bar that stays at the foot of the screen (the feed's
 * listing types, the console's sections, a screen's action bar) is marked
 * `data-bottom-bar`; this measures how much of the screen's foot such a bar
 * covers and sets it on the page as `--snt-bottom-bar`, which the toasts sit
 * above (see globals.css). With no bar, it is 0, and they sit at the foot.
 */

import { useEffect } from 'react';

function measure() {
  let covered = 0;
  for (const bar of document.querySelectorAll<HTMLElement>('[data-bottom-bar]')) {
    const box = bar.getBoundingClientRect();
    // Shown, and sitting on the bottom edge of the screen.
    if (box.height > 0 && box.bottom >= window.innerHeight - 1) {
      covered = Math.max(covered, window.innerHeight - box.top);
    }
  }
  document.documentElement.style.setProperty(
    '--snt-bottom-bar',
    `${Math.round(covered)}px`,
  );
}

export function ToastOffset() {
  useEffect(() => {
    // Measured a moment after a burst of changes, once, not on each.
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 50);
    };
    schedule();
    // Pages change under it, bars come and go, and a sticky one may only
    // reach the foot as the page scrolls.
    const changes = new MutationObserver(schedule);
    changes.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      window.clearTimeout(timer);
      changes.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
    };
  }, []);
  return null;
}
