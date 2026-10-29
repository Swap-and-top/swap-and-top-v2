'use client';

import { useEffect, useState } from 'react';

/** The value once it has stopped changing for a moment: what is typed in a
    search box, so the search waits until they pause. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const wait = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(wait);
  }, [value, ms]);
  return settled;
}
