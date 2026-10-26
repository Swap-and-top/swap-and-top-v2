/**
 * The session — whether whoever is looking is signed in.
 *
 * A stand-in. There are no real accounts yet, so "signing in" just flips this
 * and the visitor becomes the sample user. It exists so the screens can be
 * built the way they will work: a guest can browse and reveal a few numbers;
 * an account is what saves, offers and lifts the limits. When real sign-in
 * arrives — a phone number and a one-time code — it sets this, and nothing
 * that reads it changes.
 *
 * Everyone starts as a guest, as every real visitor does. Once signed in it
 * is remembered in the browser (local storage) until they sign out, so a
 * reload keeps them in. The page is drawn signed out on the server, which
 * cannot see local storage; `restoreSession` brings the sign in back before
 * the first paint, and `restored` tells anything that acts on a signed out
 * visitor (SignInGate) to wait for it.
 */

import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import { CURRENT_USER_ID } from '../mock/users';

interface SessionState {
  signedIn: boolean;
  /**
   * When they last signed out, if they did. A page for account holders tells
   * a visitor who has just signed out (sent home) from one who arrived signed
   * out (sent to sign in).
   */
  signedOutAt: number | null;
  /** Whether the remembered sign in has been brought back yet. */
  restored: boolean;
  signIn: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      signedIn: false,
      signedOutAt: null,
      restored: false,
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false, signedOutAt: Date.now() }),
    }),
    {
      name: 'snt-session',
      // The browser's local storage. Only read in the browser: hydration is
      // skipped on the server (see skipHydration).
      storage: createJSONStorage(
        () => (globalThis as { localStorage?: StateStorage }).localStorage!,
      ),
      // Only whether they are signed in is remembered.
      partialize: (state) => ({ signedIn: state.signedIn }),
      // Brought back by restoreSession once the page is in the browser, so
      // the server's page and the browser's first draw agree.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useSessionStore.setState({ restored: true });
      },
    },
  ),
);

/**
 * Brings back a remembered sign in. Called once, as the app first loads in
 * the browser (see SessionRestore); safe to call again.
 */
export function restoreSession() {
  if (useSessionStore.getState().restored) return;
  void useSessionStore.persist.rehydrate();
}

/** The signed-in user's id, or undefined for a guest. For use in a component. */
export function useViewerId(): string | undefined {
  return useSessionStore((state) => (state.signedIn ? CURRENT_USER_ID : undefined));
}

/** The same, outside a component. */
export function viewerId(): string | undefined {
  return useSessionStore.getState().signedIn ? CURRENT_USER_ID : undefined;
}

/**
 * A request to sign in, raised from anywhere a guest tries something that
 * needs an account. The app shows one sign-in sheet for all of them (see
 * SignInHost in @snt/ui); `then` runs once they are in, so the thing they
 * were doing carries on rather than being lost.
 */
interface SignInPrompt {
  /** Why an account is needed here, in a sentence. */
  reason: string;
  then?: () => void;
}

interface SignInPromptState {
  prompt: SignInPrompt | null;
  ask: (prompt: SignInPrompt) => void;
  close: () => void;
}

export const useSignInPromptStore = create<SignInPromptState>((set) => ({
  prompt: null,
  ask: (prompt) => set({ prompt }),
  close: () => set({ prompt: null }),
}));

/**
 * Runs `action` if the visitor is signed in; otherwise asks them to sign in,
 * saying why, and runs it once they have.
 */
export function requireSignIn(reason: string, action: () => void): void {
  if (useSessionStore.getState().signedIn) {
    action();
    return;
  }
  useSignInPromptStore.getState().ask({ reason, then: action });
}
