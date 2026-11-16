/**
 * Sign in, in the browser. Our own API does it (Better Auth, at /api/auth;
 * apps/api/src/accounts.ts): a sign in is a session named by a cookie this
 * page's scripts cannot read, which the browser sends with every request to
 * the API by itself. So nothing here holds a token.
 *
 * What the browser does keep is which account is signed in (its id, under
 * `snt-account`), so a page can draw signed in from its first paint and
 * tabs can tell each other. It is only a note: the cookie is what counts,
 * and a request the API turns away as not signed in clears it.
 */

import { useSessionStore } from '@snt/core';
import { isStaffPath, staffKeyFor, useStaffPassStore } from './staffPass';

/** Where the signed in account's id is noted (also read by the layout's
    first paint script and BannedGate). */
export const ACCOUNT_KEY = 'snt-account';

type Listener = (accountId: string | null, why: 'restored' | 'signed-in' | 'signed-out') => void;
const listeners = new Set<Listener>();

/** The account noted as signed in, in this browser. */
export function savedAccountId(): string | null {
  try {
    return localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return null;
  }
}

function note(accountId: string | null, why: 'signed-in' | 'signed-out') {
  try {
    if (accountId) localStorage.setItem(ACCOUNT_KEY, accountId);
    else localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    // No storage: this tab still knows.
  }
  for (const listener of listeners) listener(accountId, why);
}

/**
 * Tells `listener` who is signed in: at once with what this browser has
 * noted, then whenever someone signs in or out, here or in another tab.
 * Returns how to stop.
 */
export function onAccountChange(listener: Listener): () => void {
  listeners.add(listener);
  listener(savedAccountId(), 'restored');
  const otherTab = (event: StorageEvent) => {
    if (event.key === ACCOUNT_KEY) listener(event.newValue, event.newValue ? 'signed-in' : 'signed-out');
  };
  window.addEventListener('storage', otherTab);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', otherTab);
  };
}

interface AuthAnswer {
  ok: boolean;
  status?: number;
  /** Better Auth's code, such as EMAIL_NOT_VERIFIED. */
  code?: string;
  body: { user?: { id?: string; email?: string }; [key: string]: unknown };
}

/** A call to our sign in endpoints. */
async function authCall(path: string, body?: unknown, method: 'GET' | 'POST' = 'POST'): Promise<AuthAnswer> {
  const response = await fetch(`/api/auth${path}`, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  }).catch(() => null);
  const answer = ((await response?.json().catch(() => null)) ?? {}) as AuthAnswer['body'];
  return {
    ok: Boolean(response?.ok),
    status: response?.status,
    code: typeof answer.code === 'string' ? answer.code : undefined,
    body: answer,
  };
}

/** Signs in by email and password: `unverified` when the email still needs
    its code, `wrong` when they do not match an account. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error?: 'unverified' | 'wrong' | 'failed' }> {
  const answer = await authCall('/sign-in/email', { email, password });
  if (answer.ok && answer.body.user?.id) {
    note(answer.body.user.id, 'signed-in');
    return {};
  }
  if (answer.code === 'EMAIL_NOT_VERIFIED') return { error: 'unverified' };
  return { error: answer.status && answer.status < 500 ? 'wrong' : 'failed' };
}

/** Makes an account by email; its email is then verified with a code. */
export async function signUpWithEmail(details: {
  name: string;
  email: string;
  password: string;
  location?: string;
}): Promise<{ error?: 'taken' | 'failed' }> {
  // Asked first: signing up with an email already on an account answers
  // as if it had worked, so that it cannot be told from outside.
  const check = await fetch('/api/account/email-taken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: details.email }),
  }).catch(() => null);
  const { taken } = ((await check?.json().catch(() => null)) ?? {}) as { taken?: boolean };
  if (!check?.ok) return { error: 'failed' };
  if (taken) return { error: 'taken' };
  return (await authCall('/sign-up/email', details)).ok ? {} : { error: 'failed' };
}

/** Verifies an email with the code sent to it. */
export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  return (await authCall('/email-otp/verify-email', { email, otp: code })).ok;
}

/** Sends a code to a new email for the signed in account (Settings). */
export async function requestEmailChange(newEmail: string): Promise<boolean> {
  return (await authCall('/email-otp/request-email-change', { newEmail })).ok;
}

/** Makes the new email the account's, with the code sent to it. */
export async function changeEmail(newEmail: string, code: string): Promise<boolean> {
  return (await authCall('/email-otp/change-email', { newEmail, otp: code })).ok;
}

/** Sends a sign in code to a phone. */
export async function sendPhoneCode(phone: string): Promise<boolean> {
  return (await authCall('/phone-number/send-otp', { phoneNumber: phone })).ok;
}

/** Signs in with the code sent to a phone; a new number makes an account. */
export async function signInWithPhoneCode(phone: string, code: string): Promise<boolean> {
  const answer = await authCall('/phone-number/verify', { phoneNumber: phone, code });
  if (!answer.ok || !answer.body.user?.id) return false;
  note(answer.body.user.id, 'signed-in');
  return true;
}

/** Signs out, here and in this browser's other tabs. */
export async function signOut(): Promise<boolean> {
  const answer = await authCall('/sign-out');
  // Signed out here whatever the server said: the note goes.
  note(null, 'signed-out');
  return answer.ok;
}

/** The API said this browser is not signed in after all: forget the note. */
export function signedOutElsewhere() {
  if (savedAccountId()) note(null, 'signed-out');
}

/** Sends the link that resets a password, if the email is on an account. */
export async function sendPasswordReset(email: string): Promise<boolean> {
  return (await authCall('/request-password-reset', { email, redirectTo: '/signin/reset' })).ok;
}

/** Saves a new password with the token from a reset link. */
export async function resetPassword(token: string, password: string): Promise<'done' | 'expired' | 'failed'> {
  const answer = await authCall('/reset-password', { token, newPassword: password });
  if (answer.ok) return 'done';
  return answer.code === 'INVALID_TOKEN' ? 'expired' : 'failed';
}

/** The email the signed in account signs in with, if it has one. */
export async function signInEmail(): Promise<string | null> {
  // Read from the database, not the copy kept in the cookie.
  const answer = await authCall('/get-session?disableCookieCache=true', undefined, 'GET');
  const email = answer.body.user?.email;
  return email && !email.endsWith('@phone.swapandtop.invalid') ? email : null;
}

/**
 * A number in the form the API takes. A Zimbabwe one as people write it:
 * 0771 234 567, 771234567 and +263 77 123 4567 all become +263771234567.
 * Another country's typed with its code, as someone helping from abroad
 * would: +55 84 9653 0703 becomes +558496530703. Undefined when it is
 * neither.
 */
export function toPhone(typed: string): string | undefined {
  const digits = typed.replace(/\D/g, '');
  const international = /^\s*(\+|00)/.test(typed);
  if (international && !digits.replace(/^00/, '').startsWith('263')) {
    const full = digits.replace(/^00/, '');
    return /^[1-9]\d{7,14}$/.test(full) ? `+${full}` : undefined;
  }
  const local = digits.startsWith('263')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return /^7\d{8}$/.test(local) ? `+263${local}` : undefined;
}

/**
 * A call to the API as the signed in person: the browser sends their sign
 * in cookie with it. Returns the parsed body, or `error` with the API's
 * message (and its `code`, such as `limit`, where it gives one).
 */
export async function apiAsViewer<T>(
  path: string,
  init: { method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown },
): Promise<{ data?: T; error?: string; code?: string; status?: number }> {
  if (!savedAccountId()) return { error: 'Sign in again to carry on.', status: 401 };
  // A staff request carries this device's staff pass (lib/staffPass.ts).
  const staffKey = isStaffPath(path) ? staffKeyFor(useSessionStore.getState().viewer?.id) : undefined;
  // A form (a photo) goes as it is, the browser setting its own type.
  const form = init.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method: init.method,
    headers: {
      ...(form ? {} : { 'Content-Type': 'application/json' }),
      ...(staffKey ? { 'X-Staff-Key': staffKey } : {}),
    },
    body: init.body === undefined ? undefined : form ? (init.body as FormData) : JSON.stringify(init.body),
  }).catch(() => null);
  const body = (await response?.json().catch(() => ({}))) as
    | { error?: string; code?: string }
    | undefined;
  if (!response?.ok) {
    // The pass has ended or was turned down: the password screen again.
    if (body?.code === 'staff-key') useStaffPassStore.getState().drop();
    // Deleted on a data request: the sign in left here is ended.
    if (body?.code === 'deleted') void signOut();
    // The sign in has ended (its 30 days, or signed out elsewhere).
    else if (response?.status === 401 && !body?.code) signedOutElsewhere();
    return {
      error: body?.error ?? 'Something went wrong. Try again in a minute.',
      code: body?.code,
      // None when the server could not be reached at all.
      status: response?.status,
    };
  }
  return { data: body as T };
}
