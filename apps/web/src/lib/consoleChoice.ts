'use client';

/**
 * Which store the Store console is open for, for someone in more than one
 * store. Chosen from Me ("Open Store console" under each store, which opens
 * `/console/stock?store=<id>`) and remembered in this browser, so moving
 * between console pages keeps it. Without a choice the console opens the
 * first store with a pass.
 */

import { create } from 'zustand';

const KEY = 'snt-console-store';

function remembered(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export const useConsoleChoice = create<{ storeId: string | null; choose: (storeId: string) => void }>(
  (set) => ({
    storeId: typeof window === 'undefined' ? null : remembered(),
    choose: (storeId) => {
      try {
        localStorage.setItem(KEY, storeId);
      } catch {
        // No storage: it holds for this visit only.
      }
      set({ storeId });
    },
  }),
);
