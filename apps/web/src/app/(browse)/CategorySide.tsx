'use client';

/**
 * The feed's categories as a side menu from 768px up (wherever the header
 * shows its buttons, not the three lines): a white card down the left, its
 * left edge level with the logo's, as tall as its items, that stays in
 * view as the feed scrolls. On a phone the categories are the row
 * of pills under the search bar instead, and this is not shown.
 */

import { CATEGORY_LABELS, type Category } from '@snt/core';
import { CategoryIcon, GridIcon, ListIcon } from '@snt/ui/icons';
import styles from './CategorySide.module.css';

export function CategorySide({
  categories,
  active,
  onChange,
}: {
  categories: (Category | 'all')[];
  active: Category | 'all';
  onChange: (value: Category | 'all') => void;
}) {
  return (
    <aside className={styles.side}>
      <nav className={styles.card} aria-label="Categories">
        <span className={styles.heading}>
          <span className={styles.headingIcon} aria-hidden>
            <ListIcon size={18} />
          </span>
          Categories
        </span>
        <ul className={styles.list}>
          {categories.map((value) => (
            <li key={value}>
              <button
                type="button"
                className={[styles.item, active === value ? styles.active : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-current={active === value ? 'true' : undefined}
                onClick={() => onChange(value)}
              >
                {/* Each with its icon here; the pills on a phone have none. */}
                {value === 'all' ? (
                  <GridIcon size={18} />
                ) : (
                  <CategoryIcon category={value} size={18} />
                )}
                {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
