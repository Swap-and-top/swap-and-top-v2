'use client';

/**
 * Which store the Store console is open for: the signed in person's own,
 * set by the console's gate in the web app (apps/web/src/app/console/
 * layout.tsx) once it knows the store has a pass. The console's header reads
 * it; pages read it to load that store's data.
 */

import { createContext, useContext } from 'react';
import type { Store } from '@snt/core';

export const ConsoleTargetContext = createContext<Store | null>(null);

/**
 * How many of the store's leads are new, for the badge on Leads: set by the
 * same gate from the store's real leads. Undefined outside the gate, where
 * a page's own number is shown (the reference pages).
 */
export const ConsoleLeadCountContext = createContext<number | undefined>(undefined);

/** The store the console is open for, or null outside the gate. */
export function useConsoleTarget(): Store | null {
  return useContext(ConsoleTargetContext);
}
