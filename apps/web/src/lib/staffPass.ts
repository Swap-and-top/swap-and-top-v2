'use client';

/**
 * This device's staff pass (see apps/api/src/staffPass.ts): given when the
 * Staff console's password is entered, sent as `X-Staff-Key` with every
 * staff request (apiAsViewer), and kept in the browser's storage so it
 * lasts the day on this device. It is only for the person it was given to,
 * and is dropped when it ends or the API turns it down (`code:
 * 'staff-key'`), which brings back the password screen.
 */

import { create } from 'zustand';

interface Pass {
  personId: string;
  key: string;
  /** When it ends, in milliseconds. */
  until: number;
  /** Opened with the sealed super admin account. */
  sealed?: boolean;
}

const STORAGE = 'snt-staff-pass';

function read(): Pass | null {
  try {
    const saved = window.localStorage.getItem(STORAGE);
    return saved ? (JSON.parse(saved) as Pass) : null;
  } catch {
    return null;
  }
}

export const useStaffPassStore = create<{
  pass: Pass | null;
  keep: (pass: Pass) => void;
  drop: () => void;
}>((set) => ({
  pass: typeof window === 'undefined' ? null : read(),
  keep: (pass) => {
    try {
      window.localStorage.setItem(STORAGE, JSON.stringify(pass));
    } catch {
      // Not kept past this page: asked again next time.
    }
    set({ pass });
  },
  drop: () => {
    try {
      window.localStorage.removeItem(STORAGE);
    } catch {
      // Nothing kept to remove.
    }
    set({ pass: null });
  },
}));

/** This person's pass, if it has not ended; outside a component. */
export function staffKeyFor(personId: string | undefined): string | undefined {
  const pass = useStaffPassStore.getState().pass;
  return pass && pass.personId === personId && pass.until > Date.now() ? pass.key : undefined;
}

/** Whether this person has a pass that has not ended, in a component. */
export function useHasStaffPass(personId: string | undefined): boolean {
  return useStaffPassStore(
    (state) => Boolean(state.pass && state.pass.personId === personId && state.pass.until > Date.now()),
  );
}

/** Whether this device's console was opened with the sealed account. */
export function useSealedPass(personId: string | undefined): boolean {
  return useStaffPassStore((state) => Boolean(state.pass && state.pass.personId === personId && state.pass.sealed));
}

/** Whether an API path is a staff one, needing the pass. */
export const isStaffPath = (path: string) => /^\/(staff|admin)\//.test(path);
