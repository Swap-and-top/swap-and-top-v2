'use client';

/**
 * The heading over a list of search results, and the filters it can open.
 *
 * The heading says what the list is and how many listings are in it; at its
 * right end a "Filters" button opens and closes the filters beneath it — a
 * category and a listing-type dropdown, then a price range. They start
 * closed, so the results come first. While closed, the button counts the
 * filters that are narrowing the list, so none of them is hidden.
 */

import type { ReactNode } from 'react';
import type { SearchCategory, TypeFilter } from '@snt/core';
import { Eyebrow, Field } from '@snt/ui';
import { FilterSelect } from './FilterSelect';
import { CATEGORY_OPTIONS, TYPE_OPTIONS } from './searchParams';
import styles from './SearchFilters.module.css';

export interface SearchFilterValues {
  category: SearchCategory;
  type: TypeFilter;
  min: string;
  max: string;
}

export function SearchFilters({
  heading,
  count,
  open,
  onToggle,
  values,
  onChange,
}: {
  /** What the list is, e.g. `Search results for “iph”`. */
  heading: ReactNode;
  /** Listings in the list. Left out, no count is shown. */
  count?: number;
  open: boolean;
  onToggle: () => void;
  values: SearchFilterValues;
  onChange: (change: Partial<SearchFilterValues>) => void;
}) {
  const narrowing = [
    values.category !== 'all',
    values.type !== 'all',
    values.min !== '',
    values.max !== '',
  ].filter(Boolean).length;

  const digits = (value: string) => value.replace(/[^0-9]/g, '');

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <Eyebrow className={styles.heading}>
          {heading}
          {count === undefined ? null : (
            <span className={styles.count}>
              {count} {count === 1 ? 'listing' : 'listings'}
            </span>
          )}
        </Eyebrow>

        <button
          type="button"
          className={[styles.toggle, open ? styles.toggleOn : '']
            .filter(Boolean)
            .join(' ')}
          aria-expanded={open}
          aria-controls="search-filters"
          onClick={onToggle}
        >
          Filters
          {narrowing > 0 ? (
            <span className={styles.badge} aria-label={`${narrowing} on`}>
              {narrowing}
            </span>
          ) : null}
        </button>
      </div>

      {open ? (
        <div id="search-filters" className={styles.filters}>
          {/* Category on the left, listing type on the right. */}
          <div className={styles.pair}>
            <FilterSelect
              label="Category"
              value={values.category}
              options={CATEGORY_OPTIONS}
              onChange={(category) => onChange({ category })}
            />
            <FilterSelect
              label="Listing type"
              value={values.type}
              options={TYPE_OPTIONS}
              onChange={(type) => onChange({ type })}
            />
          </div>

          <div className={[styles.pair, styles.prices].join(' ')}>
            <Field
              label="Min price"
              inputMode="numeric"
              placeholder="$0"
              value={values.min}
              onChange={(event) => onChange({ min: digits(event.target.value) })}
              size="sm"
              pill
            />
            <Field
              label="Max price"
              inputMode="numeric"
              placeholder="Any"
              value={values.max}
              onChange={(event) => onChange({ max: digits(event.target.value) })}
              size="sm"
              pill
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
