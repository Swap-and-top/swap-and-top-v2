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
 * Everyone starts as a guest, as every real visitor does.
 */

import { create } from 'zustand';
import { CURRENT_USER_ID } from '../mock/users';

interface SessionState {
  signedIn: boolean;
  /**
   * When they last signed out, if they did. A page for account holders tells
   * a visitor who has just signed out (sent home) from one who arrived signed
   * out (sent to sign in).
   */
  signedOutAt: number | null;
  signIn: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  signedIn: false,
  signedOutAt: null,
  signIn: () => set({ signedIn: true }),
  signOut: () => set({ signedIn: false, signedOutAt: Date.now() }),
}));

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
