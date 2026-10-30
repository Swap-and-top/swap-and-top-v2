/**
 * Boosts (docs/business/monetization.md): a listing shown in the feed's
 * labelled Sponsored slots for a daily budget, from $1 to $100 a day, for a
 * day, a week or a month. Its poster boosts it, or anyone running the store
 * it is posted as. While a boost runs (started, not ended, not stopped) the
 * listing is sponsored wherever listings are read (`loadListings`).
 *
 * Paid as a test payment until Paynow is set up: recorded as paid at once,
 * with its event. Buying while one runs extends it, at the new budget.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, desc, eq, gt, gte, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { dayMonth } from '../passes';
import { ErrorSchema } from '../schemas';
import { personFor } from './me';
import { roleIn } from './post';

export const boostRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const DAY = 24 * 60 * 60 * 1000;

const SponsorshipSchema = z
  .object({
    listingId: z.string(),
    /** Set when the listing is a store's. */
    storeId: z.string().optional(),
    dailyBudget: z.number(),
    /** "20 Oct" */
    startedLabel: z.string(),
    /** "3 Nov" */
    endsLabel: z.string(),
    daysLeft: z.number(),
    /** Its budget for the days it has run so far. */
    spent: z.number(),
    /** Reveals on the listing since it started. */
    revealsSince: z.number(),
    paymentRef: z.string().optional(),
  })
  .openapi('Sponsorship');

type BoostRow = typeof t.boosts.$inferSelect;

async function sponsorshipOut(boost: BoostRow, storeId: string | null) {
  const now = Date.now();
  const ran = Math.max(1, Math.ceil((Math.min(now, boost.endsAt.getTime()) - boost.startsAt.getTime()) / DAY));
  const [since] = await db
    .select({ n: count() })
    .from(t.reveals)
    .where(and(eq(t.reveals.listingId, boost.listingId), gte(t.reveals.createdAt, boost.startsAt)));
  const [payment] = boost.paymentId
    ? await db.select({ ref: t.payments.providerRef }).from(t.payments).where(eq(t.payments.id, boost.paymentId))
    : [];
  return {
    listingId: boost.listingId,
    storeId: storeId ?? undefined,
    dailyBudget: boost.dailyBudget,
    startedLabel: dayMonth(boost.startsAt),
    endsLabel: dayMonth(boost.endsAt),
    daysLeft: Math.max(0, Math.ceil((boost.endsAt.getTime() - now) / DAY)),
    spent: boost.dailyBudget * ran,
    revealsSince: since?.n ?? 0,
    paymentRef: payment?.ref ?? undefined,
  };
}

/** The boost running on a listing now, if any. */
async function runningOn(listingId: string): Promise<BoostRow | undefined> {
  const [boost] = await db
    .select()
    .from(t.boosts)
    .where(and(eq(t.boosts.listingId, listingId), gt(t.boosts.endsAt, new Date()), isNull(t.boosts.stoppedAt)))
    .orderBy(desc(t.boosts.endsAt));
  return boost;
}

/**
 * The listing, if this person may boost it: its poster, or its store's owner
 * and staff. Paying for a boost on a store's listing is the owner's alone
 * (`paying`): staff look after stock, not payments.
 */
async function boostable(personId: string, listingId: string, paying = false) {
  const [listing] = await db.select().from(t.listings).where(eq(t.listings.id, listingId));
  if (!listing) return undefined;
  if (listing.storeId === null) return listing.ownerId === personId ? listing : null;
  const role = await roleIn(personId, listing.storeId);
  const allowed = paying ? role === 'owner' : role !== null;
  return allowed ? listing : null;
}

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not yours to boost', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'No such listing, or no boost', content: { 'application/json': { schema: ErrorSchema } } },
};

/* --- yours ----------------------------------------------------------------- */

const mine = createRoute({
  method: 'get',
  path: '/me/boosts',
  tags: ['Boosts'],
  summary: 'Your boosts',
  description: 'Boosts running now on your listings and on your stores\' listings.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: { description: 'Running boosts', content: { 'application/json': { schema: z.object({ boosts: z.array(SponsorshipSchema) }) } } },
    401: errors[401],
  },
});

boostRoutes.openapi(mine, async (c) => {
  const person = await personFor(c.get('authUser'));
  const stores = db
    .select({ id: t.storeMembers.storeId })
    .from(t.storeMembers)
    .where(and(eq(t.storeMembers.personId, person.id), isNull(t.storeMembers.removedAt)));
  const rows = await db
    .select({ boost: t.boosts, storeId: t.listings.storeId })
    .from(t.boosts)
    .innerJoin(t.listings, eq(t.listings.id, t.boosts.listingId))
    .where(
      and(
        gt(t.boosts.endsAt, new Date()),
        isNull(t.boosts.stoppedAt),
        // Their personal listings, and their stores' (not a store's they
        // have left, though they posted it).
        or(
          and(isNull(t.listings.storeId), eq(t.listings.ownerId, person.id)),
          and(isNotNull(t.listings.storeId), inArray(t.listings.storeId, stores)),
        ),
      ),
    )
    .orderBy(desc(t.boosts.endsAt));
  return c.json({ boosts: await Promise.all(rows.map((row) => sponsorshipOut(row.boost, row.storeId))) }, 200);
});

/* --- buying or extending --------------------------------------------------- */

const buy = createRoute({
  method: 'post',
  path: '/listings/{id}/boosts',
  tags: ['Boosts'],
  summary: 'Boost a listing',
  description:
    'A daily budget ($1 to $100) for 1, 7 or 30 days. While one runs, it is extended by the days, at the new budget. A test payment, recorded as paid at once, until Paynow is set up.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            dailyBudget: z.number().int().min(1).max(100),
            days: z.union([z.literal(1), z.literal(7), z.literal(30)]),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Boosted', content: { 'application/json': { schema: SponsorshipSchema } } },
    ...errors,
  },
});

boostRoutes.openapi(buy, async (c) => {
  const { id } = c.req.valid('param');
  const { dailyBudget, days } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const listing = await boostable(person.id, id, true);
  if (listing === undefined) return c.json({ error: 'That listing is not there any more.' }, 404);
  if (listing === null) {
    return c.json({ error: 'Only its poster, or its store’s owner, can pay to boost it.' }, 403);
  }
  if (listing.status !== 'live') return c.json({ error: 'Only a live listing can be boosted.' }, 400);

  const now = new Date();
  const running = await runningOn(id);
  const amount = dailyBudget * days;

  const boost = await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(t.payments)
      .values({
        personId: person.id,
        storeId: listing.storeId,
        purpose: 'boost',
        amount,
        provider: 'test',
        providerRef: `TEST-${crypto.randomUUID()}`,
        status: 'paid',
        paidAt: now,
      })
      .returning({ id: t.payments.id });
    await tx.insert(t.paymentEvents).values({
      paymentId: payment!.id,
      body: { test: true, purpose: 'boost', listingId: id, dailyBudget, days, amount },
    });
    if (running) {
      const [extended] = await tx
        .update(t.boosts)
        .set({ dailyBudget, endsAt: new Date(running.endsAt.getTime() + days * DAY), paymentId: payment!.id })
        .where(eq(t.boosts.id, running.id))
        .returning();
      return extended!;
    }
    const [started] = await tx
      .insert(t.boosts)
      .values({
        listingId: id,
        boughtById: person.id,
        dailyBudget,
        startsAt: now,
        endsAt: new Date(now.getTime() + days * DAY),
        paymentId: payment!.id,
      })
      .returning();
    return started!;
  });
  return c.json(await sponsorshipOut(boost, listing.storeId), 201);
});

/* --- stopping, and taking it back -------------------------------------------- */

const stop = createRoute({
  method: 'post',
  path: '/listings/{id}/boosts/stop',
  tags: ['Boosts'],
  summary: 'Stop a boost',
  description: 'Stops the boost running on the listing now. Nothing is refunded.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Stopped', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    ...errors,
  },
});

boostRoutes.openapi(stop, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  const listing = await boostable(person.id, id);
  if (!listing) return c.json({ error: 'Only its poster, or its store, can stop its boost.' }, 403);
  const running = await runningOn(id);
  if (!running) return c.json({ error: 'It is not boosted.' }, 404);
  await db.update(t.boosts).set({ stoppedAt: new Date() }).where(eq(t.boosts.id, running.id));
  return c.json({ ok: true }, 200);
});

const restore = createRoute({
  method: 'post',
  path: '/listings/{id}/boosts/restore',
  tags: ['Boosts'],
  summary: 'Take back a stop',
  description: 'Undoes the last stop, while its paid days have not run out.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Running again', content: { 'application/json': { schema: SponsorshipSchema } } },
    ...errors,
  },
});

boostRoutes.openapi(restore, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  const listing = await boostable(person.id, id);
  if (!listing) return c.json({ error: 'Only its poster, or its store, can change its boost.' }, 403);
  const [stopped] = await db
    .select()
    .from(t.boosts)
    .where(and(eq(t.boosts.listingId, id), gt(t.boosts.endsAt, new Date()), isNotNull(t.boosts.stoppedAt)))
    .orderBy(desc(t.boosts.stoppedAt));
  if (!stopped) return c.json({ error: 'There is no boost to put back.' }, 404);
  const [back] = await db.update(t.boosts).set({ stoppedAt: null }).where(eq(t.boosts.id, stopped.id)).returning();
  return c.json(await sponsorshipOut(back!, listing.storeId), 200);
});
