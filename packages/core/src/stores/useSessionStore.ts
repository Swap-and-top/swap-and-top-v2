/**
 * The session: whether whoever is looking is signed in, and as whom.
 *
 * Sign in is a phone number and a one time code, through Supabase Auth. The
 * web app keeps this store in step with Supabase (see SessionRestore there):
 * `signedIn` once Supabase has a session, and `viewer` once the API has said
 * who that is (GET /api/me). Supabase remembers the session in the browser,
 * so a reload keeps them in.
 *
 * Everyone starts as a guest. The page is drawn signed out on the server,
 * which cannot see the browser's session; `restored` tells anything that acts
 * on a signed out visitor (SignInGate) to wait until the browser has looked.
 */

import { create } from 'zustand';
import type { Role, StaffMembership } from '../types/user';

/** The signed in person, as the API returns them. */
export interface Viewer {
  id: string;
  /** Empty for a new person until they give their name. */
  displayName: string;
  phone?: string;
  /** Needed to post, make offers and reach other people. */
  phoneVerified: boolean;
  role: Exclude<Role, 'guest'>;
  /** The departments of our own team they are in; empty for everyone else. */
  staff: StaffMembership[];
  standing: 'good' | 'warned' | 'limited' | 'suspended' | 'banned';
  /** The stores they own or work for. */
  stores: {
    id: string;
    slug: string;
    name: string;
    role: 'owner' | 'staff';
    /** "10 Nov", while a store pass runs; missing for a free store. */
    paidUntil?: string;
    /** The store's own number, for its owner; missing when it uses theirs. */
    phone?: string;
    /** Verified store, and whether a request for it is waiting. */
    verified?: boolean;
    verifyPending?: boolean;
  }[];
}

interface SessionState {
  signedIn: boolean;
  /** Who is signed in, once the API has answered. */
  viewer: Viewer | null;
  /**
   * When they last signed out, if they did. A page for account holders tells
   * a visitor who has just signed out (sent home) from one who arrived signed
   * out (sent to sign in).
   */
  signedOutAt: number | null;
  /** Whether the browser has looked for a remembered sign in yet. */
  restored: boolean;
  /** Ends the session. The web app connects this to Supabase. */
  signOut: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  signedIn: false,
  viewer: null,
  signedOutAt: null,
  restored: false,
  signOut: () => set({ signedIn: false, viewer: null, signedOutAt: Date.now() }),
}));

/** The name to show for them; a new person has not given theirs yet. */
export const viewerName = (viewer: Viewer): string => viewer.displayName || 'New member';

/** The signed in person's id, or undefined for a guest. For use in a component. */
export function useViewerId(): string | undefined {
  return useSessionStore((state) => state.viewer?.id);
}

/** The same, outside a component. */
export function viewerId(): string | undefined {
  return useSessionStore.getState().viewer?.id;
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

/**
 * A request to verify a phone, raised where a signed in person without a
 * verified phone tries what needs one: posting, making an offer. The web app
 * shows one sheet for all of them (VerifyPhoneHost); `then` runs once the
 * phone is verified, so what they were doing carries on.
 */
interface PhonePrompt {
  /** Why a phone is needed here, in a sentence. */
  reason: string;
  then?: () => void;
}

interface PhonePromptState {
  prompt: PhonePrompt | null;
  ask: (prompt: PhonePrompt) => void;
  close: () => void;
}

export const usePhonePromptStore = create<PhonePromptState>((set) => ({
  prompt: null,
  ask: (prompt) => set({ prompt }),
  close: () => set({ prompt: null }),
}));

/** Whether the signed in person may post and make offers. */
export function hasVerifiedPhone(): boolean {
  const { viewer } = useSessionStore.getState();
  // Still loading who they are: let it through rather than ask twice.
  return viewer ? viewer.phoneVerified : true;
}

/**
 * Runs `action` for someone signed in with a verified phone. A guest is
 * asked to sign in first (`signIn`); someone without a verified phone is
 * asked to verify it (`phone`). Either way the action runs once they have.
 */
export function requireVerifiedPhone(
  reasons: { signIn: string; phone: string },
  action: () => void,
): void {
  const withPhone = () => {
    if (hasVerifiedPhone()) action();
    else usePhonePromptStore.getState().ask({ reason: reasons.phone, then: action });
  };
  requireSignIn(reasons.signIn, withPhone);
}
