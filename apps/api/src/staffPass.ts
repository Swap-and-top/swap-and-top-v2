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
 * made from the server's own sign in secret (AUTH_SECRET), so nothing new
 * is set up. It is not stored: changing that secret ends every pass.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { authSecret, passwordMatches } from './accounts';
import { db } from './db/client';
import * as t from './db/schema';

/** How long a pass lasts: a working day. */
export const STAFF_PASS_HOURS = 12;

function signingKey(): Buffer {
  // Its own key, made from the secret, used for nothing else.
  return createHmac('sha256', authSecret()).update('snt-staff-pass').digest();
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
 * Whether this is the account's password: checked against the hash kept
 * for the account, as a sign in would be. An account with no password
 * (one that only ever signed in by phone code) has none to give.
 */
export async function passwordIsRight(authUserId: string, password: string): Promise<boolean> {
  const [account] = await db
    .select({ password: t.authAccounts.password })
    .from(t.authAccounts)
    .where(and(eq(t.authAccounts.userId, authUserId), eq(t.authAccounts.providerId, 'credential')));
  if (!account?.password) return false;
  return passwordMatches(account.password, password).catch(() => false);
}
