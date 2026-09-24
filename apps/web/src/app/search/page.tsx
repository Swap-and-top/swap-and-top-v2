'use client';

/**
 * Search — specification filters per category.
 *
 * The category selector drives which filter groups appear: choose Laptops and
 * you get processor and graphics; choose Phones and you get battery health
 * instead. Filters are never generic, because that is the whole advantage.
 *
 * The result count is live, so you can tell you are over-constraining before you
 * submit. Wireframe artboard: `Search`.
 */

import Link from 'next/link';
import {
  CATEGORY_LABELS,
  liveListings,
  searchListings,
  SPEC_OPTIONS,
  useSearchStore,
  type Category,
} from '@snt/core';
import {
  Button,
  Chip,
  ChipRow,
  ChipWrap,
  Eyebrow,
  Field,
  ListingCard,
  Screen,
  ScreenBody,
  Stack,
} from '@snt/ui';
import { ChevronLeftIcon } from '@snt/ui/icons';
import styles from './page.module.css';

const CATEGORIES: Category[] = [
  'laptops',
  'desktops',
  'phones',
  'consoles',
  'parts',
  'accessories',
];

export default function SearchPage() {
  const state = useSearchStore();
  const {
    query,
    category,
    minPrice,
    maxPrice,
    setQuery,
    setCategory,
    toggle,
    setMinPrice,
    setMaxPrice,
    clear,
  } = state;

  const results = searchListings(liveListings, state);

  const anyFilterActive =
    query.trim().length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    state.processor.length > 0 ||
    state.ram.length > 0 ||
    state.storage.length > 0 ||
    state.graphics.length > 0 ||
    state.condition.length > 0;

  return (
    <Screen>
      <div className={styles.header}>
        <Link href="/" aria-label="Back" className={styles.back}>
          <ChevronLeftIcon size={22} />
        </Link>
        <Field
          label="Search gadgets"
          hideLabel
          type="search"
          placeholder="Search phones, laptops, consoles, parts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          pill
          className={styles.queryField}
        />
      </div>

      <div className={styles.categoryRow}>
        <ChipRow label="Search within category">
          {CATEGORIES.map((value) => (
            <Chip
              key={value}
              selected={category === value}
              onClick={() => setCategory(value)}
            >
              {CATEGORY_LABELS[value]}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <ScreenBody top={false}>
        <div className={styles.groups}>
          {/* Filter groups come from the category, so they are always relevant. */}
          {(SPEC_OPTIONS[category] ?? []).map((group) => (
            <div key={`${category}-${group.label}`} className={styles.group}>
              <Eyebrow className={styles.groupLabel}>{group.label}</Eyebrow>
              <ChipWrap label={group.label}>
                {group.values.map((value) => (
                  <Chip
                    key={value}
                    square
                    tone="ink"
                    selected={(state[group.group] as string[]).includes(value)}
                    onClick={() => toggle(group.group, value)}
                  >
                    {value}
                  </Chip>
                ))}
              </ChipWrap>
            </div>
          ))}

          <div className={styles.priceRow}>
            <Field
              label="Min price"
              inputMode="numeric"
              placeholder="$0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              size="sm"
            />
            <Field
              label="Max price"
              inputMode="numeric"
              placeholder="Any"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              size="sm"
            />
          </div>
        </div>

        {/* Results render under the filters, which stay visible and editable. */}
        {anyFilterActive ? (
          <div className={styles.results}>
            <Eyebrow className={styles.resultsLabel}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Eyebrow>

            {results.length > 0 ? (
              <Stack gap={6}>
                {results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </Stack>
            ) : (
              <Stack gap={5}>
                <Eyebrow>Nothing matched</Eyebrow>
                <Button variant="secondary" onClick={clear}>
                  Relax the filters
                </Button>
                {/* A dead end becomes a lead. */}
                <Button variant="dashed">Post this as a request instead</Button>
              </Stack>
            )}
          </div>
        ) : null}
      </ScreenBody>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={clear}>
          Clear
        </Button>
        <Button size="lg" block>
          Show {results.length} {results.length === 1 ? 'result' : 'results'}
        </Button>
      </div>
    </Screen>
  );
}
