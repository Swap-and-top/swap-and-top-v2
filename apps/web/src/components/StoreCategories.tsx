'use client';

/**
 * What a store sells: a chip for each category, as many as apply. Chosen
 * when opening a store and changed in Edit store details; the store's page
 * shows these as its tabs (Storefront).
 */

import { useId } from 'react';
import { CATEGORY_LABELS, type Category } from '@snt/core';
import { Chip, ChipWrap } from '@snt/ui';
import styles from './StoreCategories.module.css';

const ALL = Object.keys(CATEGORY_LABELS) as Category[];

export function StoreCategories({
  value,
  onChange,
}: {
  value: Category[];
  onChange: (next: Category[]) => void;
}) {
  const label = useId();
  return (
    <div className={styles.field}>
      <span id={label} className={styles.label}>
        What you sell
      </span>
      <ChipWrap label="What you sell">
        {ALL.map((category) => {
          const on = value.includes(category);
          return (
            <Chip
              key={category}
              selected={on}
              onClick={() => onChange(on ? value.filter((each) => each !== category) : [...value, category])}
            >
              {CATEGORY_LABELS[category]}
            </Chip>
          );
        })}
      </ChipWrap>
      <span className={styles.hint}>Choose all that apply. They become the tabs on your store page.</span>
    </div>
  );
}
