'use client';

/**
 * FilterSide: a search's filters as a card down the left, from 768px up,
 * where the feed has its categories (and as wide). Always open: category
 * and listing type in the app's own dropdowns, then the price range, min
 * and max side by side. On a phone the filters are behind the Filter button over the
 * results instead (SearchFilters), and this is not shown.
 *
 * Placed by whoever shows it: down the results page like the categories
 * (`side`), or beside the search panel (SearchEntry).
 */

import { useRef, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import { Dropdown, Field } from '@snt/ui';
import { FilterIcon } from '@snt/ui/icons';
import type { SearchFilterValues } from './SearchFilters';
import { CATEGORY_OPTIONS, TYPE_OPTIONS } from './searchParams';
import styles from './FilterSide.module.css';

export function FilterSide({
  values,
  onChange,
  onSubmit,
  className,
  style,
  ref,
}: {
  values: SearchFilterValues;
  onChange: (change: Partial<SearchFilterValues>) => void;
  /** Enter in the max price, after the keyboard is put away. */
  onSubmit?: () => void;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}) {
  const narrowing = [
    values.category !== 'all',
    values.type !== 'all',
    values.min !== '',
    values.max !== '',
  ].filter(Boolean).length;
  const digits = (value: string) => value.replace(/[^0-9]/g, '');
  const prices = useRef<HTMLDivElement>(null);
  const nextOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    prices.current?.querySelectorAll('input')[1]?.focus();
  };
  const searchOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.currentTarget.blur();
    onSubmit?.();
  };

  return (
    <div ref={ref} className={[styles.card, className].filter(Boolean).join(' ')} style={style}>
      <span className={styles.heading}>
        <span className={styles.headingIcon} aria-hidden>
          <FilterIcon size={17} weight={2} />
        </span>
        Filters
        {/* How many are narrowing the list, as on the phone's Filter button. */}
        {narrowing > 0 ? (
          <span className={styles.badge} aria-label={`${narrowing} on`}>
            {narrowing}
          </span>
        ) : null}
      </span>

      <div className={styles.fields}>
        {/* The app's own dropdowns, no labels: "All categories" and "All
            types" say what each is. */}
        <Dropdown
          value={values.category}
          options={CATEGORY_OPTIONS}
          onChange={(category) => onChange({ category })}
        />
        <Dropdown
          value={values.type}
          options={TYPE_OPTIONS}
          onChange={(type) => onChange({ type })}
        />
        <div ref={prices} className={styles.prices}>
          <Field
            label="Min price"
            inputMode="numeric"
            enterKeyHint="next"
            onKeyDown={nextOnEnter}
            placeholder="$0"
            value={values.min}
            onChange={(event) => onChange({ min: digits(event.target.value) })}
            size="sm"
            pill
          />
          <Field
            label="Max price"
            inputMode="numeric"
            enterKeyHint="search"
            onKeyDown={searchOnEnter}
            placeholder="Any"
            value={values.max}
            onChange={(event) => onChange({ max: digits(event.target.value) })}
            size="sm"
            pill
          />
        </div>
      </div>
    </div>
  );
}
