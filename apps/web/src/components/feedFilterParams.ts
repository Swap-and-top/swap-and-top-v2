/**
 * The feed filters as they appear in the address, e.g.
 * `/?type=swap&category=phones`. Plain functions, so the server can read the
 * address and render the right view on the first paint.
 */

import {
  CATEGORY_LABELS,
  type CategoryFilter,
  type TypeFilter,
} from '@snt/core';

/** Words in the address. "wanted" reads better there than "request". */
export const TYPE_TO_PARAM: Record<Exclude<TypeFilter, 'all'>, string> = {
  swap: 'swap',
  sale: 'sale',
  request: 'wanted',
};

/** Only what the address names; a filter it leaves out is undefined. */
export interface FeedFilterParams {
  category?: CategoryFilter;
  type?: TypeFilter;
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFeedFilterParams(params: SearchParams): FeedFilterParams {
  const category = first(params.category);
  const type = first(params.type);
  const typeMatch = Object.entries(TYPE_TO_PARAM).find(([, word]) => word === type);

  return {
    category:
      category && category in CATEGORY_LABELS
        ? (category as CategoryFilter)
        : undefined,
    type: typeMatch ? (typeMatch[0] as TypeFilter) : undefined,
  };
}
