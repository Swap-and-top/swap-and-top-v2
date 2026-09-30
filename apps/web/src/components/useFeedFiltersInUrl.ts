'use client';

/**
 * Keeps the feed filters in the address, e.g. `/?type=swap&category=phones`,
 * so a refresh, a shared link or the back button lands on the same view.
 *
 * The filters themselves stay in `useFeedStore`, so a category picked on
 * Browse still carries over to Wanted. On load the address wins; if it names
 * no filter, the store's current one is kept and written into the address.
 * After that, every change to the store rewrites the address in place — a
 * replace, not a new history entry, so Back leaves the page rather than
 * stepping back through every chip that was tapped.
 */

import { useEffect, useLayoutEffect, useState } from 'react';
import {
  CATEGORY_LABELS,
  useFeedStore,
  type CategoryFilter,
  type TypeFilter,
} from '@snt/core';

/** Words in the address. "wanted" reads better there than "request". */
const TYPE_TO_PARAM: Record<Exclude<TypeFilter, 'all'>, string> = {
  swap: 'swap',
  sale: 'sale',
  request: 'wanted',
};

function typeFromParam(value: string | null): TypeFilter | undefined {
  const match = Object.entries(TYPE_TO_PARAM).find(([, word]) => word === value);
  return match ? (match[0] as TypeFilter) : undefined;
}

function categoryFromParam(value: string | null): CategoryFilter | undefined {
  return value && value in CATEGORY_LABELS
    ? (value as CategoryFilter)
    : undefined;
}

export function useFeedFiltersInUrl({
  withType = true,
}: {
  /** Off on Wanted, which filters by category only. */
  withType?: boolean;
} = {}) {
  const { category, type, setCategory, setType } = useFeedStore();
  const [readAddress, setReadAddress] = useState(false);

  // Before the first paint, so a refreshed page opens on its filters rather
  // than flashing "All" first.
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCategory = categoryFromParam(params.get('category'));
    const fromType = typeFromParam(params.get('type'));
    if (fromCategory) setCategory(fromCategory);
    if (withType && fromType) setType(fromType);
    setReadAddress(true);
  }, [setCategory, setType, withType]);

  useEffect(() => {
    if (!readAddress) return;

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
  }, [readAddress, category, type, withType]);
}
