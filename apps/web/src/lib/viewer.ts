'use client';

/**
 * Who is signed in (GET /api/me) as a TanStack Query, keyed by the Supabase
 * user (SessionRestore runs it). Its answer goes into the session store,
 * which the rest of the app reads. After a change to who they are (a new
 * store, a store renamed or closed, a store pass), `refreshViewer` reads it
 * again.
 */

import type { QueryClient } from '@tanstack/react-query';

export const viewerKey = (authUserId: string | undefined) => ['viewer', authUserId] as const;

/** Reads who they are again, and waits for it. */
export async function refreshViewer(queryClient: QueryClient): Promise<void> {
  await queryClient.refetchQueries({ queryKey: ['viewer'], type: 'active' });
}
