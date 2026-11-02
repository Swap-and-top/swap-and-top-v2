'use client';

/**
 * Where the Staff console opens for the signed in person: their first
 * section, straight there. The web app knows the sections and provides it
 * (StaffHomeProvider in its root layout); the account menu's staff pill
 * links to it. Outside a provider, the console's front door, /staff.
 */

import { createContext, useContext } from 'react';

export const StaffHomeContext = createContext('/staff');

export function useStaffHomeHref(): string {
  return useContext(StaffHomeContext);
}
