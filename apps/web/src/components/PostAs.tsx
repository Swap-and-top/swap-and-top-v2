'use client';

/**
 * Post as: for someone with a store, one choice at the top of posting,
 * starting on the store (docs/product/accounts-and-stores.md). Nobody
 * without a store sees it.
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
  if (stores.length === 0 || postAs === null) return null;
  return stores.some((store) => store.id === postAs) ? postAs! : stores[0]!.id;
}

const ME = 'me';

export function PostAsChoice() {
  const label = useId();
  const viewer = useSessionStore((state) => state.viewer);
  const setPostAs = usePostDraftStore((state) => state.setPostAs);
  const postAs = usePostAs();
  if (!viewer || viewer.stores.length === 0) return null;

  const options = [
    ...viewer.stores.map((store) => ({ value: store.id, label: store.name })),
    { value: ME, label: viewerName(viewer) },
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
      />
    </div>
  );
}
