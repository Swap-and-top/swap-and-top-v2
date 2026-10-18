'use client';

/**
 * Filters for the stock list, in a sheet over it: status, category, the
 * order, and whether it takes trade ins. Choices are tried out here and only
 * applied with the button, which says how many items they leave, so nobody
 * applies filters that show nothing.
 */

import { useId, useState } from 'react';
import {
  CATEGORY_LABELS,
  NO_STOCK_FILTERS,
  STOCK_SORT_LABELS,
  type Category,
  type Listing,
  type StockFilter,
  type StockFilters,
  type StockSort,
} from '@snt/core';
import {
  Button,
  Chip,
  ChipWrap,
  Dropdown,
  Sheet,
  TickTile,
  useCloseSheet,
} from '@snt/ui';
import { filterStock } from './filterStock';
import styles from './StockFiltersSheet.module.css';

const STATUSES: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'sold', label: 'Sold' },
];

const CATEGORIES: ('all' | Category)[] = [
  'all',
  'laptops',
  'phones',
  'desktops',
  'consoles',
  'parts',
  'accessories',
  'other',
];

export function StockFiltersSheet({
  stock,
  query,
  filters,
  onApply,
  onClose,
}: {
  stock: Listing[];
  query: string;
  filters: StockFilters;
  onApply: (filters: StockFilters) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Filters" narrow onClose={onClose}>
      <FiltersForm
        stock={stock}
        query={query}
        filters={filters}
        onApply={onApply}
      />
    </Sheet>
  );
}

function FiltersForm({
  stock,
  query,
  filters,
  onApply,
}: {
  stock: Listing[];
  query: string;
  filters: StockFilters;
  onApply: (filters: StockFilters) => void;
}) {
  const close = useCloseSheet();
  const [draft, setDraft] = useState(filters);
  const sortLabel = useId();
  const count = filterStock(stock, draft, query).length;

  const set = (change: Partial<StockFilters>) =>
    setDraft((current) => ({ ...current, ...change }));

  return (
    <div className={styles.form}>
      <div className={styles.group}>
        <span className={styles.label}>Status</span>
        <ChipWrap label="Status">
          {STATUSES.map(({ value, label }) => (
            <Chip
              key={value}
              square
              selected={draft.status === value}
              onClick={() => set({ status: value })}
            >
              {label}
            </Chip>
          ))}
        </ChipWrap>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Category</span>
        <ChipWrap label="Category">
          {CATEGORIES.map((value) => (
            <Chip
              key={value}
              square
              selected={draft.category === value}
              onClick={() => set({ category: value })}
            >
              {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
            </Chip>
          ))}
        </ChipWrap>
      </div>

      <div className={styles.group}>
        <span id={sortLabel} className={styles.label}>
          Order
        </span>
        <Dropdown<StockSort>
          labelledBy={sortLabel}
          value={draft.sort}
          onChange={(sort) => set({ sort })}
          options={(Object.keys(STOCK_SORT_LABELS) as StockSort[]).map(
            (value) => ({ value, label: STOCK_SORT_LABELS[value] }),
          )}
        />
      </div>

      <TickTile
        checked={draft.swapsOnly}
        onChange={(swapsOnly) => set({ swapsOnly })}
        label="Only items that accept swaps"
        hint="The ones marked “Swaps accepted”."
      />

      {/* At the foot of the form: clear, and apply with the count. */}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setDraft(NO_STOCK_FILTERS)}
        >
          Clear
        </Button>
        <Button
          size="lg"
          disabled={count === 0}
          onClick={() => {
            onApply(draft);
            close();
          }}
        >
          {count === 0
            ? 'Nothing matches'
            : `Show ${count} ${count === 1 ? 'item' : 'items'}`}
        </Button>
      </div>
    </div>
  );
}
