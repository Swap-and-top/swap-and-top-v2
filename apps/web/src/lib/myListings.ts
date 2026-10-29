'use client';

/**
 * The signed in person's own listings (GET /api/me/listings), every state,
 * through TanStack Query: one request for Me and My listings alike, kept
 * while they move between them. Null until loaded; empty, with the reason
 * in a toast, when it cannot be.
 */

import { useQuery } from '@tanstack/react-query';
import type { Listing } from '@snt/core';
import { apiGet } from './query';

export const myListingsKey = (personId: string | undefined) => ['me', personId, 'listings'] as const;

export function useMyListings(personId: string | undefined): Listing[] | null {
  const query = useQuery({
    queryKey: myListingsKey(personId),
    queryFn: () => apiGet<{ listings: Listing[] }>('/me/listings').then((data) => data.listings),
    enabled: Boolean(personId),
    meta: { toast: true },
  });
  return query.data ?? (query.isError ? [] : null);
}
