'use client';

/**
 * Which sections of the Overview this person gets, and how many tiles in
 * each, worked out in the browser from their departments, so the skeleton
 * has the page's own shape before the numbers come (rule 12). The same
 * lists as the API's (apps/api/src/routes/overview.ts), which decides what
 * is shown; this only shapes the wait.
 */

import { useMemo } from 'react';
import { useSessionStore, type Department } from '@snt/core';

export interface SectionShape {
  key: string;
  tiles: number;
  /** A line in place of tiles: DevOps, until Phase 7. */
  note?: boolean;
}

/** The business's six what happened. */
const BUSINESS = ['newUsers', 'newListings', 'offers', 'deals', 'valueSwapped', 'revenue'];

export function useOverviewShape(): SectionShape[] | undefined {
  const viewer = useSessionStore((state) => state.viewer);
  // Worked out once a viewer, not in the store's selector, which must
  // hand back the same thing each time.
  return useMemo(() => {
    if (!viewer) return undefined;
    const superAdmin = viewer.role === 'super_admin';
    const staff = viewer.staff ?? [];
    const inDept = (department: Department, lead = false) =>
      superAdmin || staff.some((row) => row.department === department && (!lead || row.lead));
    const executive = inDept('executives');
    const leader = inDept('trust_safety', true);

    const wanted: { key: string; tiles: string[] }[] = [];
    if (executive || inDept('board')) {
      wanted.push({
        key: 'business',
        tiles: [
          ...BUSINESS,
          ...(executive ? ['activeUsers', 'liveListings', 'payingStores', 'verifiedStores', 'openReports', 'appealsWaiting'] : []),
        ],
      });
    }
    if (inDept('trust_safety')) {
      wanted.push({
        key: 'trust',
        tiles: [
          'reportsReceived', 'reportsHandled', 'reportsYouHandled', 'actionsTaken',
          ...(leader ? ['appealsDecided'] : []),
          'openReports', 'overdueReports', 'restrictedUsers',
          ...(leader ? ['appealsWaiting', 'storesToVerify'] : []),
        ],
      });
    }
    if (inDept('sales')) {
      wanted.push({ key: 'sales', tiles: ['newStores', 'passesSold', 'storesToCall', 'passesEnding', 'passesLapsed', 'payingStores'] });
    }
    if (inDept('finance')) wanted.push({ key: 'finance', tiles: ['revenue', 'paymentsMade', 'paymentsFailed', 'passesSold', 'boostsSold'] });
    if (inDept('marketing')) wanted.push({ key: 'marketing', tiles: ['newUsers', 'activeUsers', 'listingViews', 'reveals'] });

    const shape: SectionShape[] = wanted
      .filter((section) => section.tiles.length > 0)
      .map((section) => ({ key: section.key, tiles: section.tiles.length }));
    if (inDept('devops')) shape.push({ key: 'devops', tiles: 0, note: true });
    return shape;
  }, [viewer]);
}
