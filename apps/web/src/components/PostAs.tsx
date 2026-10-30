'use client';

/**
 * Post as: for someone with a store, one choice at the top of posting,
 * starting on themselves, their name first and then their stores
 * (docs/product/accounts-and-stores.md). A store's listings are the
 * store's, not in their My listings, so posting to a store is the choice
 * they make, never one made for them (Hillary, 2026-10-30). Nobody without
 * a store sees it.
 */

import { useId } from 'react';
import { usePostDraftStore, useSessionStore, viewerName } from '@snt/core';
import { Dropdown } from '@snt/ui';
import styles from './PostAs.module.css';

/** One empty list, so a guest's stores are the same each time they are read. */
const NO_STORES: never[] = [];

/** The store a new listing goes up as, or null for the person themselves. */
export function usePostAs(): string | null {
  const stores = useSessionStore((state) => state.viewer?.stores ?? NO_STORES);
  const postAs = usePostDraftStore((state) => state.postAs);
  // Not chosen yet, or a store they are no longer in: themselves.
  if (!postAs) return null;
  return stores.some((store) => store.id === postAs) ? postAs : null;
}

const ME = 'me';

export function PostAsChoice() {
  const label = useId();
  const viewer = useSessionStore((state) => state.viewer);
  const setPostAs = usePostDraftStore((state) => state.setPostAs);
  const postAs = usePostAs();
  if (!viewer || viewer.stores.length === 0) return null;

  const options = [
    { value: ME, label: viewerName(viewer) },
    ...viewer.stores.map((store) => ({ value: store.id, label: store.name })),
  ];
  return (
    <div className={styles.postAs}>
      <span id={label} className={styles.label}>
        Post as
      </span>
      <Dropdown
        value={postAs ?? ME}
        options={options}
        onChange={(value) => setPostAs(value === ME ? null : value)}
        labelledBy={label}
        className={styles.choice}
      />
    </div>
  );
}
