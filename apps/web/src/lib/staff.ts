'use client';

/**
 * Whether the signed in person may use a department's part of the Staff
 * console (docs/product/staff-console.md): in the department (as its lead,
 * where it needs one), or the super admin. Only for what is shown; the API
 * checks every request itself.
 */

import { useSessionStore, type Department } from '@snt/core';

export function useInDepartment(department: Department, lead = false): boolean | undefined {
  return useSessionStore((state) => {
    const viewer = state.viewer;
    if (!viewer) return undefined;
    if (viewer.role === 'super_admin') return true;
    return (viewer.staff ?? []).some((row) => row.department === department && (!lead || row.lead));
  });
}

/** Whether they are on our team at all: any department, or the super admin. */
export function useOnTeam(): boolean {
  return useSessionStore((state) =>
    Boolean(state.viewer && (state.viewer.role === 'super_admin' || (state.viewer.staff ?? []).length > 0)),
  );
}
