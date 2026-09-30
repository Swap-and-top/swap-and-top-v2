'use client';

/**
 * The feed filters, kept in the address so a refresh, a shared link or the
 * back button lands on the same view — without a flash of "All" first.
 *
 * The page's server half reads the address and passes what it names in as
 * `initial`. The server renders from it, the browser's first render does
 * too, and the store is seeded from it before the first paint — so nothing
 * jumps once the page wakes up.
 *
 * The filters themselves stay in `useFeedStore`, so a category picked on
 * Browse still carries over to Wanted: a filter the address leaves out keeps
 * the store's current value, and is written into the address. Every change
 * rewrites the address in place — a replace, not a new history entry, so
 * Back leaves the page rather than stepping back through every chip tapped.
 */

import { useEffect, useLayoutEffect, useState } from 'react';
import { useFeedStore } from '@snt/core';
import { TYPE_TO_PARAM, type FeedFilterParams } from './feedFilterParams';

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
    const seed: FeedFilterParams = {};
    if (initial.category) seed.category = initial.category;
    if (withType && initial.type) seed.type = initial.type;
    if (seed.category || seed.type) useFeedStore.setState(seed);
    setSeeded(true);
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
