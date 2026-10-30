/**
 * The staff pass (docs/product/staff-console.md, section 9: "Staff sign in
 * more strongly"). A phone code alone can be had by swapping someone's SIM
 * card, so the Staff console also asks for the account's password, once a
 * day on each device. Given the right one, `POST /api/staff/unlock` hands
 * the device this pass, good for 12 hours; every other staff request
 * (`/api/staff/...` and `/api/admin/...`) must carry it in `X-Staff-Key`
 * (checked in app.ts), or is refused with `code: 'staff-key'`.
 *
 * The pass names the person it is for and when it ends, signed with a key
 * made from the server's own Supabase secret, so nothing new is set up. It
 * is not stored: changing that secret ends every pass.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** How long a pass lasts: a working day. */
export const STAFF_PASS_HOURS = 12;

function signingKey(): Buffer {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('SUPABASE_SECRET_KEY is needed for the staff pass.');
  // Its own key, made from the secret, used for nothing else.
  return createHmac('sha256', secret).update('snt-staff-pass').digest();
}

const signOf = (body: string) => createHmac('sha256', signingKey()).update(body).digest('base64url');

/** A pass for this person, ending `STAFF_PASS_HOURS` from now. */
export function issueStaffPass(personId: string): { key: string; until: number } {
  const until = Date.now() + STAFF_PASS_HOURS * 60 * 60_000;
  const body = `${personId}.${until}`;
  return { key: `${body}.${signOf(body)}`, until };
}

/** Whether this is a pass for this person that has not ended. */
export function staffPassValid(key: string | undefined, personId: string): boolean {
  if (!key) return false;
  const cut = key.lastIndexOf('.');
  if (cut < 0) return false;
  const body = key.slice(0, cut);
  const given = Buffer.from(key.slice(cut + 1));
  const wanted = Buffer.from(signOf(body));
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return false;
  const [who, until] = body.split('.');
  return who === personId && Number(until) > Date.now();
}

/**
 * Whether this is the account's password, asked of Supabase Auth as a sign
 * in would be (by its email, or its phone when it has none). Nothing is
 * kept from the answer.
 */
export async function passwordIsRight(
  account: { email: string | null; phone: string | null },
  password: string,
): Promise<boolean> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are needed to check a password.');
  }
  const login = account.email ? { email: account.email } : account.phone ? { phone: account.phone } : null;
  if (!login) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...login, password }),
  }).catch(() => null);
  return Boolean(response?.ok);
}
