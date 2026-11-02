'use client';

/**
 * Hands the shared UI where the Staff console opens for the signed in
 * person (their first section; see useStaffHome), for the account menu's
 * staff pill. In the root layout.
 */

import type { ReactNode } from 'react';
import { StaffHomeContext } from '@snt/ui';
import { useStaffHome } from '@/app/staff/sections';

export function StaffHomeProvider({ children }: { children: ReactNode }) {
  return <StaffHomeContext.Provider value={useStaffHome()}>{children}</StaffHomeContext.Provider>;
}
