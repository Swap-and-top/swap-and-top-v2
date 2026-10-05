/**
 * Specification search.
 *
 * The platform's main advantage over a title-only search, and the screen a
 * dealer judges in four seconds. Filter sets are per category: choosing
 * Laptops shows processor and graphics, choosing Phones shows battery health.
 */

import { create } from 'zustand';
import type { Category, Condition, Listing } from '../types/listing';

export interface SpecFilters {
  processor: string[];
  ram: string[];
  storage: string[];
  graphics: string[];
  condition: Condition[];
}

/** "All" searches every category. */
export type SearchCategory = Category | 'all';

interface SearchState extends SpecFilters {
  query: string;
  category: SearchCategory;
  minPrice: string;
  maxPrice: string;
  setQuery: (query: string) => void;
  setCategory: (category: SearchCategory) => void;
  toggle: (group: keyof SpecFilters, value: string) => void;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
  clear: () => void;
}

const emptyFilters: SpecFilters = {
  processor: [],
  ram: [],
  storage: [],
  graphics: [],
  condition: [],
};

/** The filter values offered per category, mirroring the Search artboard. */
export const SPEC_OPTIONS: Record<
  Category,
  { group: keyof SpecFilters; label: string; values: string[] }[]
> = {
  laptops: [
    {
      group: 'processor',
      label: 'Processor',
      values: ['Core i5', 'Core i7', 'Ryzen 5', 'Ryzen 7', 'M1 / M2'],
    },
    { group: 'ram', label: 'RAM', values: ['8GB', '16GB', '32GB', '64GB+'] },
    {
      group: 'storage',
      label: 'Storage',
      values: ['128GB', '256GB SSD', '512GB', '1TB'],
    },
    {
      group: 'graphics',
      label: 'Graphics',
      values: ['Integrated', 'GTX', 'RTX', 'Radeon'],
    },
    {
      group: 'condition',
      label: 'Condition',
      values: ['Like new', 'Good', 'Fair', 'For parts'],
    },
  ],
  desktops: [
    {
      group: 'processor',
      label: 'Processor',
      values: ['Core i5', 'Core i7', 'Ryzen 5', 'Ryzen 7'],
    },
    { group: 'ram', label: 'RAM', values: ['8GB', '16GB', '32GB', '64GB+'] },
    {
      group: 'storage',
      label: 'Storage',
      values: ['256GB SSD', '512GB', '1TB', '2TB'],
    },
    {
      group: 'graphics',
      label: 'Graphics',
      values: ['Integrated', 'GTX', 'RTX', 'Radeon'],
    },
    {
      group: 'condition',
      label: 'Condition',
      values: ['Like new', 'Good', 'Fair', 'For parts'],
    },
  ],
  phones: [
    {
      group: 'storage',
      label: 'Storage',
      values: ['64GB', '128GB', '256GB', '512GB'],
    },
    { group: 'ram', label: 'RAM', values: ['4GB', '6GB', '8GB', '12GB'] },
    {
      group: 'condition',
      label: 'Condition',
      values: ['Like new', 'Good', 'Fair', 'For parts'],
    },
  ],
  consoles: [
    {
      group: 'storage',
      label: 'Storage',
      values: ['500GB', '825GB', '1TB', '2TB'],
    },
    {
      group: 'condition',
      label: 'Condition',
      values: ['Like new', 'Good', 'Fair', 'For parts'],
    },
  ],
  parts: [
    {
      group: 'graphics',
      label: 'Part type',
      values: ['Graphics card', 'Memory', 'Storage', 'Processor'],
    },
    {
      group: 'condition',
      label: 'Condition',
      values: ['Like new', 'Good', 'Fair', 'For parts'],
    },
  ],
  accessories: [
    {
      group: 'condition',
      label: 'Condition',
      values: ['Like new', 'Good', 'Fair', 'For parts'],
    },
  ],
};

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  category: 'all',
  minPrice: '',
  maxPrice: '',
  ...emptyFilters,
  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category, ...emptyFilters }),
  toggle: (group, value) =>
    set((state) => {
      const current = state[group] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { [group]: next } as unknown as Partial<SearchState>;
    }),
  setMinPrice: (minPrice) => set({ minPrice }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  clear: () => set({ query: '', minPrice: '', maxPrice: '', ...emptyFilters }),
}));

function priceOf(listing: Listing): number | undefined {
  if (listing.type === 'sale') return listing.price;
  if (listing.type === 'request') return listing.budget;
  if (listing.type === 'auction') return listing.currentBid ?? listing.startingPrice;
  return listing.cashAmount;
}

function specHaystack(listing: Listing): string {
  const items =
    listing.type === 'swap'
      ? [listing.has, listing.wants]
      : listing.type === 'request'
        ? [listing.wants, listing.tradeIn]
        : [listing.item];

  return items
    .filter((i) => i !== undefined)
    .flatMap((item) => [
      item.name,
      item.brand ?? '',
      item.model ?? '',
      ...Object.values(item.specs),
      item.condition ?? '',
    ])
    .join(' ')
    .toLowerCase();
}

/**
 * Deliberately generous. A dealer would rather dismiss a marginal result than
 * never see a real one — the same principle as lead matching.
 */
export function searchListings(
  listings: Listing[],
  state: Pick<
    SearchState,
    | 'query'
    | 'category'
    | 'minPrice'
    | 'maxPrice'
    | keyof SpecFilters
  >,
): Listing[] {
  const query = state.query.trim().toLowerCase();
  const min = state.minPrice ? Number(state.minPrice.replace(/[^0-9]/g, '')) : undefined;
  const max = state.maxPrice ? Number(state.maxPrice.replace(/[^0-9]/g, '')) : undefined;

  return listings.filter((listing) => {
    if (state.category !== 'all' && listing.category !== state.category) {
      return false;
    }

    const haystack = `${listing.title} ${specHaystack(listing)}`;
    if (query && !haystack.includes(query)) return false;

    const groups: (keyof SpecFilters)[] = [
      'processor',
      'ram',
      'storage',
      'graphics',
      'condition',
    ];
    for (const group of groups) {
      const selected = state[group];
      if (selected.length === 0) continue;
      const anyMatch = selected.some((value) =>
        haystack.includes(value.toLowerCase()),
      );
      if (!anyMatch) return false;
    }

    const price = priceOf(listing);
    if (price !== undefined) {
      if (min !== undefined && price < min) return false;
      if (max !== undefined && price > max) return false;
    }

    return true;
  });
}

/** No spec filters — for a search by text, category and price alone. */
export const NO_SPEC_FILTERS: SpecFilters = emptyFilters;

/**
 * Search terms to suggest while someone types, e.g. "Lenovo ThinkPad T480" for
 * "think". Drawn from the names of the items in live listings — what people
 * have and what they want — so every suggestion leads to at least one result.
 *
 * Names that start with the query come first, then names with a word that
 * starts with it, then names that merely contain it.
 */
export function suggestSearchTerms(
  listings: Listing[],
  query: string,
  category: SearchCategory = 'all',
  limit = 5,
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const seen = new Map<string, string>();
  for (const listing of listings) {
    if (category !== 'all' && listing.category !== category) continue;
    const items =
      listing.type === 'swap'
        ? [listing.has, listing.wants]
        : listing.type === 'request'
          ? [listing.wants, listing.tradeIn]
          : [listing.item];
    for (const item of items) {
      if (!item) continue;
      const key = item.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, item.name);
    }
  }

  const rank = (name: string) => {
    if (name.startsWith(q)) return 0;
    if (name.split(/[\s,/-]+/).some((word) => word.startsWith(q))) return 1;
    return 2;
  };

  return [...seen.entries()]
    .filter(([key]) => key.includes(q) && key !== q)
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .slice(0, limit)
    .map(([, name]) => name);
}
