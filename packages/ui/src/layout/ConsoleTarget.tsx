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

/** The store the console is open for, or null outside the gate. */
export function useConsoleTarget(): Store | null {
  return useContext(ConsoleTargetContext);
}
