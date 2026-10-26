'use client';

/**
 * Brings back a remembered sign in as the app first loads in the browser,
 * before the first paint, so a reload keeps the visitor signed in without a
 * flash of the signed out page (see useSessionStore).
 */

import { useLayoutEffect } from 'react';
import { restoreSession } from '@snt/core';

export function SessionRestore() {
  useLayoutEffect(() => {
    restoreSession();
  }, []);
  return null;
}
