'use client';

/**
 * SideMenu: a short list of choices as a white card down the left of a
 * page, from 768px up (wherever the header shows its buttons, not the
 * three lines): its left edge level with the logo's, as tall as its items,
 * staying in view as the page scrolls. A heading with its icon on a pale
 * tile, then each choice with its icon, and a count where it has one; the
 * chosen one filled in the blue. On a phone it is not shown: the page has
 * its choices as a row of pills instead.
 *
 * The feed's categories (CategorySide) and the Messages page's chats to
 * show.
 */

import type { ReactNode } from 'react';
import styles from './SideMenu.module.css';

export interface SideMenuItem<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  /** Shown after the label when more than none. */
  count?: number;
}

export function SideMenu<T extends string>({
  title,
  icon,
  items,
  active,
  onChange,
}: {
  title: string;
  icon: ReactNode;
  items: SideMenuItem<T>[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <aside className={styles.side}>
      <nav className={styles.card} aria-label={title}>
        <span className={styles.heading}>
          <span className={styles.headingIcon} aria-hidden>
            {icon}
          </span>
          {title}
        </span>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                className={[styles.item, active === item.value ? styles.active : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-current={active === item.value ? 'true' : undefined}
                onClick={() => onChange(item.value)}
              >
                {item.icon}
                {item.label}
                {item.count ? <span className={styles.count}>{item.count}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
