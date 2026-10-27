/**
 * Feed filters.
 *
 * One feed carries every listing type; chips filter it. There are no separate
 * pages for sale, swap and wanted — docs/features/feed-and-filters.md.
 */

import { create } from 'zustand';
import type { Category, Listing } from '../types/listing';

export type CategoryFilter = Category | 'all';
export type TypeFilter = 'all' | 'sale' | 'swap' | 'request';

interface FeedState {
  category: CategoryFilter;
  type: TypeFilter;
  setCategory: (category: CategoryFilter) => void;
  setType: (type: TypeFilter) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  category: 'all',
  type: 'all',
  setCategory: (category) => set({ category }),
  setType: (type) => set({ type }),
  reset: () => set({ category: 'all', type: 'all' }),
}));

/** Pure, so it can be reused on a server component or in a future app. */
export function filterFeed(
  listings: Listing[],
  filters: { category: CategoryFilter; type: TypeFilter },
): Listing[] {
  return listings.filter((listing) => {
    if (filters.category !== 'all' && listing.category !== filters.category) {
      return false;
    }
    if (filters.type !== 'all' && listing.type !== filters.type) {
      return false;
    }
    return true;
  });
}

/**
 * Interleave sponsored listings among the rest instead of sorting them
 * first. Sorting promoted listings to the top means a handful of paying dealers
 * own the entire first screen — docs/product/principles.md rule 5.
 *
 * One sponsored listing after every `everyNth` others, never two together.
 * When there are more sponsored listings than slots, the extra ones wait:
 * live, the slots would take turns between them from one visit to the next,
 * rather than piling up at the end of the feed.
 */
export function interleaveSponsored(
  listings: Listing[],
  everyNth = 3,
): Listing[] {
  const organic = listings.filter((l) => l.promotion === 'organic');
  const sponsored = listings.filter((l) => l.promotion !== 'organic');
  if (sponsored.length === 0) return organic;
  // Only sponsored listings in view (say, a filter matched nothing else):
  // show them, as there is nothing to space them among.
  if (organic.length === 0) return sponsored;

  const out: Listing[] = [];
  let sponsoredIndex = 0;

  organic.forEach((listing, index) => {
    out.push(listing);
    const atSlot = (index + 1) % everyNth === 0;
    if (atSlot && sponsoredIndex < sponsored.length) {
      out.push(sponsored[sponsoredIndex]!);
      sponsoredIndex += 1;
    }
  });

  return out;
}
