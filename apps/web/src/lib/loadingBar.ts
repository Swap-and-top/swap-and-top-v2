'use client';

/**
 * The top loading bar for a wait that stays on the page: new figures for a
 * month just chosen, a filter changed. Pass whether the page is fetching
 * (a query's `isPlaceholderData`, say) and the bar runs while it is, then
 * fills and fades (PageLoadBar). Several at once are counted. A listener on
 * a query's state, not loading.
 */

import { useEffect } from 'react';

export const DATA_LOAD_START = 'snt:data-load-start';
export const DATA_LOAD_END = 'snt:data-load-end';

export function useLoadingBar(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    window.dispatchEvent(new Event(DATA_LOAD_START));
    return () => {
      window.dispatchEvent(new Event(DATA_LOAD_END));
    };
  }, [active]);
}
