'use client';

/**
 * The feed filters, kept in the address so a refresh, a shared link or the
 * back button lands on the same view — without a flash of "All" first.
 *
 * A page's server half may read the address and pass what it names in as
 * `initial` (Wanted does): the server renders from it, the browser's first
 * render does too, and the store is seeded from it before the first paint.
 *
 * The feed instead is built once, ahead of time, so it can be served
 * instantly (see app/(browse)/page.tsx): it passes no `initial`, and the
 * address is read here, in the browser. Until then a small script in the
 * page hides the feed's filters and list when the address names a filter,
 * so "All" never flashes before the right view; seeding lifts it.
 *
 * The filters themselves stay in `useFeedStore`, so a category picked on
 * Browse still carries over to Wanted: a filter the address leaves out keeps
 * the store's current value, and is written into the address. Every change
 * rewrites the address in place — a replace, not a new history entry, so
 * Back leaves the page rather than stepping back through every chip tapped.
 */

import { useEffect, useLayoutEffect, useState } from 'react';
import { useFeedStore } from '@snt/core';
import {
  parseFeedFilterParams,
  TYPE_TO_PARAM,
  type FeedFilterParams,
} from './feedFilterParams';

/** Set on <html> by the feed's page while its filters are not yet read. */
export const FEED_FILTERS_PENDING = 'feedFilters';

export function useFeedFiltersInUrl(
  initial: FeedFilterParams,
  {
    withType = true,
  }: {
    /** Off on Wanted, which filters by category only. */
    withType?: boolean;
  } = {},
) {
  const store = useFeedStore();
  const [seeded, setSeeded] = useState(false);

  // Seed the store from the address once, before the first paint. Not during
  // render: another page may still be on screen mid-navigation, and updating
  // a shared store while rendering would disturb it. Never on the server
  // either, where the store is shared by every request.
  useLayoutEffect(() => {
    // Given by the server, or read from the address here.
    const named =
      initial.category || initial.type
        ? initial
        : parseFeedFilterParams(
            Object.fromEntries(new URLSearchParams(window.location.search)),
          );
    const seed: FeedFilterParams = {};
    if (named.category) seed.category = named.category;
    if (withType && named.type) seed.type = named.type;
    if (seed.category || seed.type) useFeedStore.setState(seed);
    setSeeded(true);
    delete document.documentElement.dataset[FEED_FILTERS_PENDING];
    // Once per mount: later changes come from the chips and tabs.
  }, []);

  // Until seeded, render exactly what the server did — from the address —
  // so the first render matches its HTML. The seeded values replace it before
  // anything is painted.
  const category = seeded ? store.category : (initial.category ?? 'all');
  const type = seeded ? store.type : (initial.type ?? 'all');

  useEffect(() => {
    // Not before seeding, or this would write "All" over the address.
    if (!seeded) return;

    const params = new URLSearchParams(window.location.search);
    if (category === 'all') params.delete('category');
    else params.set('category', category);

    if (withType) {
      if (type === 'all') params.delete('type');
      else params.set('type', TYPE_TO_PARAM[type]);
    }

    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [seeded, category, type, withType]);

  return { ...store, category, type };
}
