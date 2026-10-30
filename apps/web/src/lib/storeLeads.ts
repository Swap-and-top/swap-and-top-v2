'use client';

/**
 * A store's matching requests (GET /api/stores/{id}/leads), as one TanStack
 * Query shared by the Leads page and the console's gate, which counts the
 * new ones for the badge on Leads. One request for both.
 */

import { rememberListings, type Lead } from '@snt/core';
import { apiGet } from './query';

/** A lead as the API gives it: the requester in brief, and whether the
    store has an offer standing on it. */
export type LeadIn = Omit<Lead, 'requester'> & {
  requester: { id: string; displayName: string; confirmedDeals: number };
  offered: boolean;
};

export function storeLeadsQuery(storeId: string) {
  return {
    queryKey: ['store', storeId, 'leads'] as const,
    queryFn: () =>
      apiGet<{ leads: LeadIn[] }>(`/stores/${encodeURIComponent(storeId)}/leads`).then((data) => {
        // Found by id wherever an offer card looks its listing up.
        rememberListings(data.leads.map((lead) => lead.demand));
        return data.leads;
      }),
  };
}
