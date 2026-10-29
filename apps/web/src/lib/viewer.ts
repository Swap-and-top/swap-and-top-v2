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

/** Puts who they are, as a change just saved them, in place of what was
    loaded: the viewer query only, not the account data under its key. */
export function setViewerData(queryClient: QueryClient, viewer: unknown): void {
  queryClient.setQueriesData({ queryKey: ['viewer'], predicate: (query) => query.queryKey.length === 2 }, viewer);
}
