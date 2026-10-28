/**
 * Store passes (docs/product/accounts-and-stores.md, decisions B17 to B19).
 *
 * A store is paid exactly while one of its passes covers now: $1 a day, $5
 * a week, $15 a month, prepaid, never renewing by itself. Nothing stores a
 * "paid" flag, so nothing goes stale when a pass ends; what an end needs
 * doing is done by `settlePasses`, run as pages and the API are used:
 *
 * - **The day before** a pass ends, with nothing after it, the owner is told
 *   once.
 * - **When it ends**, with nothing covering now, the store keeps its 15 most
 *   recently updated live listings for sale or swap and pauses the rest,
 *   marked as paused by the lapse; the owner is told. A new pass puts every
 *   one of them back (`restoreLapsed`).
 */

import { and, desc, eq, gt, inArray, isNull, lte } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';

export type PassKind = 'day' | 'week' | 'month';

/** What each pass costs and how long it runs. */
export const PASSES: Record<PassKind, { days: number; price: number; label: string }> = {
  day: { days: 1, price: 1, label: '1 day' },
  week: { days: 7, price: 5, label: '1 week' },
  month: { days: 30, price: 15, label: '1 month' },
};

/** How many live listings for sale or swap a store without a pass keeps. */
export const FREE_STORE_LIMIT = 15;

const DAY = 24 * 60 * 60 * 1000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "10 Nov", in Harare's time. */
export function dayMonth(at: Date): string {
  const local = new Date(at.getTime() + 2 * 60 * 60 * 1000);
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
}

/**
 * When the store's paid time runs to, counting passes bought ahead, or null
 * when no pass covers now.
 */
export async function paidUntil(storeId: string, now = new Date()): Promise<Date | null> {
  const passes = await db
    .select({ startsAt: t.storePasses.startsAt, endsAt: t.storePasses.endsAt })
    .from(t.storePasses)
    .where(and(eq(t.storePasses.storeId, storeId), gt(t.storePasses.endsAt, now)))
    .orderBy(t.storePasses.startsAt);
  let end: Date | null = null;
  for (const pass of passes) {
    // The first must cover now; each after it must follow on.
    if (end === null ? pass.startsAt > now : pass.startsAt > end) break;
    if (end === null || pass.endsAt > end) end = pass.endsAt;
  }
  return end;
}

/** The store's owner, to tell about its pass. */
async function ownerOf(storeId: string): Promise<string | undefined> {
  const [owner] = await db
    .select({ personId: t.storeMembers.personId })
    .from(t.storeMembers)
    .where(
      and(
        eq(t.storeMembers.storeId, storeId),
        eq(t.storeMembers.role, 'owner'),
        isNull(t.storeMembers.removedAt),
      ),
    );
  return owner?.personId;
}

/** Puts back every listing the store's last lapse paused. How many. */
export async function restoreLapsed(storeId: string): Promise<number> {
  const back = await db
    .update(t.listings)
    .set({ status: 'live', pausedByLapse: false })
    .where(
      and(
        eq(t.listings.storeId, storeId),
        eq(t.listings.status, 'paused'),
        eq(t.listings.pausedByLapse, true),
      ),
    )
    .returning({ id: t.listings.id });
  return back.length;
}

/** Pauses what a store without a pass may not keep live. How many. */
async function pauseOverLimit(storeId: string): Promise<number> {
  const live = await db
    .select({ id: t.listings.id })
    .from(t.listings)
    .where(
      and(
        eq(t.listings.storeId, storeId),
        eq(t.listings.status, 'live'),
        inArray(t.listings.type, ['sale', 'swap']),
      ),
    )
    .orderBy(desc(t.listings.updatedAt));
  const over = live.slice(FREE_STORE_LIMIT).map((row) => row.id);
  if (over.length === 0) return 0;
  await db
    .update(t.listings)
    .set({ status: 'paused', pausedByLapse: true })
    .where(inArray(t.listings.id, over));
  return over.length;
}

/** Last run, so busy pages settle passes at most once a minute each. */
let lastSettled = 0;

/** Sends due reminders and deals with ended passes. Never throws. */
export async function settlePasses(now = new Date()): Promise<void> {
  if (now.getTime() - lastSettled < 60_000) return;
  lastSettled = now.getTime();
  try {
    // The day before: passes ending within a day, with nothing after them.
    const ending = await db
      .select({ id: t.storePasses.id, storeId: t.storePasses.storeId, endsAt: t.storePasses.endsAt, name: t.stores.name })
      .from(t.storePasses)
      .innerJoin(t.stores, eq(t.stores.id, t.storePasses.storeId))
      .where(
        and(
          gt(t.storePasses.endsAt, now),
          lte(t.storePasses.endsAt, new Date(now.getTime() + DAY)),
          isNull(t.storePasses.reminderSentAt),
          isNull(t.stores.closedAt),
        ),
      );
    for (const pass of ending) {
      const until = await paidUntil(pass.storeId, now);
      if (until && until > pass.endsAt) continue; // another follows on
      const owner = await ownerOf(pass.storeId);
      if (owner) {
        await db.insert(t.notifications).values({
          personId: owner,
          kind: 'account',
          text: `The store pass for ${pass.name} ends tomorrow. Extend it to keep all your listings live.`,
          href: '/me',
        });
      }
      await db.update(t.storePasses).set({ reminderSentAt: now }).where(eq(t.storePasses.id, pass.id));
    }

    // Ended: passes over and not yet dealt with.
    const ended = await db
      .select({ id: t.storePasses.id, storeId: t.storePasses.storeId, name: t.stores.name })
      .from(t.storePasses)
      .innerJoin(t.stores, eq(t.stores.id, t.storePasses.storeId))
      .where(and(lte(t.storePasses.endsAt, now), isNull(t.storePasses.lapseHandledAt)));
    const stores = new Map(ended.map((pass) => [pass.storeId, pass.name]));
    for (const [storeId, name] of stores) {
      // Still paid by another pass: nothing to do but mark these dealt with.
      if (!(await paidUntil(storeId, now))) {
        const paused = await pauseOverLimit(storeId);
        const owner = await ownerOf(storeId);
        if (owner) {
          await db.insert(t.notifications).values({
            personId: owner,
            kind: 'account',
            text:
              paused > 0
                ? `The store pass for ${name} has ended. ${paused} ${paused === 1 ? 'listing is' : 'listings are'} paused until you get a new pass.`
                : `The store pass for ${name} has ended. It is a free store again, with up to ${FREE_STORE_LIMIT} live listings.`,
            href: '/me',
          });
        }
      }
      await db
        .update(t.storePasses)
        .set({ lapseHandledAt: now })
        .where(
          and(
            eq(t.storePasses.storeId, storeId),
            lte(t.storePasses.endsAt, now),
            isNull(t.storePasses.lapseHandledAt),
          ),
        );
    }
  } catch (error) {
    // A page must never fail for this; the next run tries again.
    console.warn('Could not settle store passes', error);
    lastSettled = 0;
  }
}

/**
 * Buys a pass for a store, as a test payment until Paynow is set up: the
 * payment is recorded as paid at once, with its event, and the pass starts
 * now or, if paid time is running, where it ends. Every listing the last
 * lapse paused goes live again.
 */
export async function buyPass(personId: string, storeId: string, kind: PassKind) {
  const now = new Date();
  const { days, price } = PASSES[kind];
  const running = await paidUntil(storeId, now);
  const startsAt = running ?? now;
  const endsAt = new Date(startsAt.getTime() + days * DAY);

  await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(t.payments)
      .values({
        personId,
        storeId,
        purpose: 'store_pass',
        amount: price,
        provider: 'test',
        providerRef: `TEST-${crypto.randomUUID()}`,
        status: 'paid',
        paidAt: now,
      })
      .returning({ id: t.payments.id });
    await tx.insert(t.paymentEvents).values({
      paymentId: payment!.id,
      body: { test: true, purpose: 'store_pass', kind, amount: price },
    });
    await tx.insert(t.storePasses).values({ storeId, kind, startsAt, endsAt, paymentId: payment!.id });
  });

  const restored = await restoreLapsed(storeId);
  return { endsAt, restored };
}
