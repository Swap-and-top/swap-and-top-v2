'use client';

/**
 * BottomNav — the phone's bottom bar: the feed's four listing types.
 *
 * All types, Swaps, For sale and Wanted switch the view over the one feed.
 * On a phone they live here, under the thumb, instead of in a tab row above
 * the listings; from tablet up this bar is hidden and the tab row does the
 * job (see Browse).
 *
 * On the feed it is handed the current type and switches it in place. On any
 * other screen its items go to the feed, showing the type that was tapped.
 * Posting, the account and the wishlist are reached from the header.
 */

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { useFeedStore, type TypeFilter } from '@snt/core';
import { GridIcon, ReceiveHandIcon, SwapIcon, TagIcon } from '../icons';
import styles from './BottomNav.module.css';

interface NavItem {
  type: TypeFilter;
  label: string;
  /** The feed's address for this type. */
  href: string;
}

const ITEMS: NavItem[] = [
  { type: 'all', label: 'All types', href: '/' },
  { type: 'swap', label: 'Swaps', href: '/?type=swap' },
  { type: 'sale', label: 'For sale', href: '/?type=sale' },
  { type: 'request', label: 'Wanted', href: '/?type=wanted' },
];

/**
 * Always the outline: the active item is marked by the blue pill behind its
 * icon, which turns the icon white, not by filling the icon in.
 */
function iconFor(type: TypeFilter) {
  switch (type) {
    case 'all':
      return <GridIcon size={20} />;
    case 'swap':
      return <SwapIcon size={20} weight={1.9} />;
    case 'sale':
      return <TagIcon size={20} />;
    default:
      return <ReceiveHandIcon size={20} />;
  }
}

export function BottomNav({
  type,
  onType,
}: {
  /** The listing type on show. Only the feed has one; elsewhere none is lit. */
  type?: TypeFilter;
  /** Switches the type in place. Without it, the items link to the feed. */
  onType?: (type: TypeFilter) => void;
}) {
  // As on the category chips: the blue slides into the tapped item's pill
  // from the side of the item that had it, while that one dissolves. Which
  // way that is has to be known before the type changes, so it is noted on
  // the bar as an item is pressed, for the CSS to read.
  function noteDirection(event: MouseEvent<HTMLElement>) {
    const bar = event.currentTarget;
    const next = (event.target as HTMLElement).closest('button');
    const current = bar.querySelector('button[aria-pressed="true"]');
    if (!next || !current || next === current) return;
    const after =
      current.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING;
    bar.dataset.travel = after ? 'forward' : 'back';
  }

  return (
    <nav
      className={styles.nav}
      aria-label="Listing type"
      onClickCapture={noteDirection}
    >
      {ITEMS.map((item) => {
        const active = item.type === type;
        const className = [styles.item, active ? styles.itemActive : '']
          .filter(Boolean)
          .join(' ');
        const content = (
          <>
            {/* The pill holds the icon only; the label sits under it. */}
            <span className={styles.pill}>{iconFor(item.type)}</span>
            <span>{item.label}</span>
          </>
        );

        return onType ? (
          <button
            key={item.type}
            type="button"
            className={className}
            aria-pressed={active}
            onClick={() => onType(item.type)}
          >
            {content}
          </button>
        ) : (
          <Link
            key={item.type}
            href={item.href}
            className={className}
            // The feed keeps its last type unless told otherwise, and the
            // address for "All types" names none — so say it outright.
            onClick={() => useFeedStore.setState({ type: item.type })}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
