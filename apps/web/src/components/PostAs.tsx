'use client';

/**
 * Who a new listing goes up as. Add New Listing (the header, the feeds, My
 * listings) always posts as the person; a store's own Add a listing opens
 * the same steps at `/post?as=<store id>`, and they post as that store
 * (Hillary, 2026-11-25: no Post as dropdown, so nothing is posted under the
 * wrong account by mistake). The choice is kept in the draft for the steps
 * after, and a fixed line says it at the top. A store's listings are the
 * store's, not in their My listings.
 */

import { POST_STEPS } from '@snt/ui';
import { usePostDraftStore, useSessionStore } from '@snt/core';
import { StorefrontIcon } from '@snt/ui/icons';
import styles from './PostAs.module.css';

/** One empty list, so a guest's stores are the same each time they are read. */
const NO_STORES: never[] = [];

/** The store a new listing goes up as, or null for the person themselves. */
export function usePostAs(): string | null {
  const stores = useSessionStore((state) => state.viewer?.stores ?? NO_STORES);
  const postAs = usePostDraftStore((state) => state.postAs);
  // Not a store, or a store they are no longer in: themselves.
  if (!postAs) return null;
  return stores.some((store) => store.id === postAs) ? postAs : null;
}

/** Where posting starts: as the person, or as a store. */
export const postStart = (storeId: string | null) =>
  storeId ? `/post?as=${encodeURIComponent(storeId)}` : '/post';

/** The steps, with Choose going back to the same start (as the store, when
    posting as one). */
export function usePostSteps() {
  const postAs = usePostAs();
  return POST_STEPS.map((step) => (step.href === '/post' ? { ...step, href: postStart(postAs) } : step));
}

/** "Posting as Kopje Computers": a fixed line while posting as a store. */
export function PostingAs() {
  const postAs = usePostAs();
  const name = useSessionStore((state) => state.viewer?.stores.find((store) => store.id === postAs)?.name);
  if (!postAs || !name) return null;
  return (
    <p className={styles.postingAs}>
      <StorefrontIcon size={16} />
      <span>
        Posting as <b>{name}</b>
      </span>
    </p>
  );
}
