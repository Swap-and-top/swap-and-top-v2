/**
 * The search results page's address, e.g.
 * `/search?q=thinkpad&category=laptops&type=sale&min=100&max=300`. Plain functions, so
 * the server can read it and render the results on the first paint.
 */

import {
  CATEGORY_LABELS,
  type Category,
  type SearchCategory,
  type TypeFilter,
} from '@snt/core';
import { TYPE_TO_PARAM } from './feedFilterParams';
import type { FilterOption } from './FilterSelect';

export interface SearchQuery {
  q: string;
  category: SearchCategory;
  type: TypeFilter;
  min: string;
  max: string;
}

/** The longest search that can be typed. Longer than any item's name. */
export const MAX_QUERY = 60;

/** The most of a search that is quoted back before it is cut short. */
const MAX_QUOTED = 20;

/**
 * A search as it is quoted back in a heading or a message: whole if it is
 * short, otherwise its start and three dots, so a long one cannot take over
 * the screen.
 */
export function quoteQuery(q: string) {
  return q.length > MAX_QUOTED ? `${q.slice(0, MAX_QUOTED).trimEnd()}…` : q;
}

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export function parseSearchQuery(params: Params): SearchQuery {
  const category = first(params.category);
  const type = first(params.type);
  const typeMatch = Object.entries(TYPE_TO_PARAM).find(([, word]) => word === type);
  return {
    q: first(params.q).trim().slice(0, MAX_QUERY).trimEnd(),
    category:
      category in CATEGORY_LABELS ? (category as SearchCategory) : 'all',
    type: typeMatch ? (typeMatch[0] as TypeFilter) : 'all',
    min: first(params.min).replace(/[^0-9]/g, ''),
    max: first(params.max).replace(/[^0-9]/g, ''),
  };
}

/** Leaves out anything at its default, so a plain search is just `?q=`. */
export function searchHref({
  q,
  category,
  type,
  min,
  max,
}: Partial<SearchQuery>) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  if (category && category !== 'all') params.set('category', category);
  if (type && type !== 'all') params.set('type', TYPE_TO_PARAM[type]);
  if (min) params.set('min', min);
  if (max) params.set('max', max);
  const query = params.toString();
  return query ? `/search?${query}` : '/search';
}

/** The category dropdown: every category, in the feed's order. */
export const CATEGORY_OPTIONS: FilterOption<SearchCategory>[] = [
  { value: 'all', label: 'All categories' },
  ...(
    [
      'phones',
      'laptops',
      'desktops',
      'consoles',
      'parts',
      'accessories',
    ] as Category[]
  ).map((value) => ({ value, label: CATEGORY_LABELS[value] })),
];

/** The listing-type dropdown, in the order of the feed's type tabs. */
export const TYPE_OPTIONS: FilterOption<TypeFilter>[] = [
  { value: 'all', label: 'All types' },
  { value: 'swap', label: 'Swaps' },
  { value: 'sale', label: 'For sale' },
  { value: 'request', label: 'Wanted' },
];
