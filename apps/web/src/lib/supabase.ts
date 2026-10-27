/**
 * The browser's Supabase client, for sign in only. It keeps the session in
 * the browser and refreshes its token; everything else goes through the API.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.warn(
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing, so sign in will not work. Add them to apps/web/.env.local, or to the Vercel project for every environment.',
  );
}

// Without the settings the client is still made, on a stand in address, so
// the pages build and load; only signing in fails, and says so.
export const supabase = createClient(url || 'https://missing.supabase.co', key || 'missing');

/**
 * A Zimbabwe number in the form Supabase takes: 0771 234 567, 771234567 and
 * +263 77 123 4567 all become +263771234567. Undefined when it is not one.
 */
export function toPhone(typed: string): string | undefined {
  const digits = typed.replace(/\D/g, '');
  const local = digits.startsWith('263')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return /^7\d{8}$/.test(local) ? `+263${local}` : undefined;
}

/** Asks the API who is signed in. Null when it cannot say. */
export async function fetchViewer(token: string) {
  const response = await fetch('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
}

/**
 * A call to the API as the signed in person: their sign in token goes with
 * it. Returns the parsed body, or `error` with the API's message (and its
 * `code`, such as `limit`, where it gives one).
 */
export async function apiAsViewer<T>(
  path: string,
  init: { method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown },
): Promise<{ data?: T; error?: string; code?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: 'Sign in again to carry on.' };
  const response = await fetch(`/api${path}`, {
    method: init.method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  }).catch(() => null);
  const body = (await response?.json().catch(() => ({}))) as
    | { error?: string; code?: string }
    | undefined;
  if (!response?.ok) {
    return { error: body?.error ?? 'Something went wrong. Try again in a minute.', code: body?.code };
  }
  return { data: body as T };
}
