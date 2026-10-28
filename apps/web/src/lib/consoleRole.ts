'use client';

/**
 * The signed in person's role in the store the Store console is open for:
 * the owner can do everything; staff do stock, offers and leads, not
 * payments (passes, boosts), verification, staff or settings
 * (docs/product/accounts-and-stores.md). The API checks it too; this only
 * keeps staff from seeing buttons they cannot use.
 */

import { useSessionStore } from '@snt/core';
import { useConsoleTarget } from '@snt/ui';

export function useConsoleRole(): 'owner' | 'staff' | null {
  const target = useConsoleTarget();
  return useSessionStore(
    (state) => state.viewer?.stores.find((store) => store.id === target?.id)?.role ?? null,
  );
}
