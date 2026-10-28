/**
 * Number reveals (docs/product/contact-and-reveals.md): someone tapped a way
 * to reach a seller (WhatsApp, a call, email, Messenger) and saw it. Each way
 * is recorded on its own, with the listing, who it was when signed in, a
 * hash of the device for the daily limit (never an identity) and whether
 * the listing was in a sponsored slot, which is how boosts are sold on
 * evidence.
 *
 * The daily limit: a guest sees 3 sellers' details a day, a member 30;
 * another way on a seller already seen today is free. A signed in reveal
 * starts a deal check that asks the one who revealed three days on; the
 * seller is asked only once they say yes (decision P27). Guests are asked
 * nothing.
 *
 * A store sees its reveals in Leads, Number reveals: who, only once they say
 * a deal happened; until then the area they are in.
 */

import { createHash } from 'node:crypto';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, countDistinct, desc, eq, gt, inArray, isNull, lte, ne } from 'drizzle-orm';
import { optionalAuth, requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { paidUntil } from '../passes';
import { ErrorSchema, ListingSchema } from '../schemas';
import { personFor } from './me';
import { isMember } from './post';

export const revealRoutes = new OpenAPIHono<{ Variables: { authUser?: AuthUser } }>();

const GUEST_DAILY = 3;
const MEMBER_DAILY = 30;
const DAY = 24 * 60 * 60 * 1000;

const way = z.enum(['whatsapp', 'call', 'email', 'messenger']);

/** The device's own random id (or, without one, its address), hashed. */
export function deviceHashOf(deviceId: string | undefined, address: string | undefined): string {
  return createHash('sha256')
    .update(deviceId || address || 'unknown')
    .digest('hex')
    .slice(0, 32);
}

const record = createRoute({
  method: 'post',
  path: '/listings/{id}/reveals',
  tags: ['Listings'],
  summary: 'Record a contact reveal',
  description:
    'Someone saw one way of reaching the seller. No sign in needed; with one, a deal check is started for the one who revealed. Send the device\'s own random id in `X-Device`. Over the daily limit (3 sellers for a guest, 30 for a member) it is refused with `code: \'limit\'`.',
  middleware: [optionalAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: z.object({ way }) } } },
  },
  responses: {
    201: { description: 'Recorded', content: { 'application/json': { schema: z.object({ recorded: z.boolean() }) } } },
    404: { description: 'No such live listing', content: { 'application/json': { schema: ErrorSchema } } },
    429: { description: 'Over the daily limit', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

revealRoutes.openapi(record, async (c) => {
  const { id } = c.req.valid('param');
  const { way: chosen } = c.req.valid('json');
  const authUser = c.get('authUser');
  const person = authUser ? await personFor(authUser) : null;
  const [listing] = await db.select().from(t.listings).where(eq(t.listings.id, id));
  if (!listing || listing.status !== 'live') return c.json({ error: 'That listing is not there any more.' }, 404);
  // Your own listing: nothing to record.
  if (person && person.id === listing.ownerId) return c.json({ recorded: false }, 201);

  const deviceHash = deviceHashOf(c.req.header('X-Device'), c.req.header('x-forwarded-for')?.split(',')[0]);
  const since = new Date(Date.now() - DAY);
  const who = person ? eq(t.reveals.viewerId, person.id) : eq(t.reveals.deviceHash, deviceHash);

  // Another way on a seller already seen today is free; a new seller counts.
  const [seenHere] = await db
    .select({ id: t.reveals.id })
    .from(t.reveals)
    .where(and(who, eq(t.reveals.listingId, id), gt(t.reveals.createdAt, since)));
  if (!seenHere) {
    const [today] = await db
      .select({ n: countDistinct(t.reveals.listingId) })
      .from(t.reveals)
      .where(and(who, gt(t.reveals.createdAt, since)));
    const limit = person ? MEMBER_DAILY : GUEST_DAILY;
    if ((today?.n ?? 0) >= limit) {
      return c.json(
        {
          error: person
            ? `You have seen ${limit} sellers’ details today, which is the daily limit. Try again tomorrow.`
            : `You have seen ${limit} sellers’ details today, which is the limit without an account. Sign in to see more.`,
          code: 'limit',
        },
        429,
      );
    }
  }

  // Was it in a sponsored slot: a boost running on it now.
  const now = new Date();
  const [boost] = await db
    .select({ id: t.boosts.id })
    .from(t.boosts)
    .where(
      and(eq(t.boosts.listingId, id), lte(t.boosts.startsAt, now), gt(t.boosts.endsAt, now), isNull(t.boosts.stoppedAt)),
    );

  const [reveal] = await db
    .insert(t.reveals)
    .values({
      listingId: id,
      viewerId: person?.id ?? null,
      deviceHash,
      slot: boost ? 'sponsored' : 'organic',
      way: chosen,
    })
    .returning({ id: t.reveals.id });

  // Signed in: they are asked, three days on, whether a deal went through.
  if (person) {
    await db
      .insert(t.dealChecks)
      .values({
        source: 'reveal',
        revealId: reveal!.id,
        listingId: id,
        askerId: person.id,
        ownerId: listing.ownerId,
        promptedAt: new Date(now.getTime() + 3 * DAY),
        lapsesAt: new Date(now.getTime() + 14 * DAY),
      })
      .onConflictDoNothing();
  }
  return c.json({ recorded: true }, 201);
});

/* --- a store's reveals, for Leads ------------------------------------------ */

const RevealSchema = z
  .object({
    id: z.string(),
    /** Who, only once they say a deal happened. */
    userId: z.string(),
    name: z.string().optional(),
    confirmedDeals: z.number().optional(),
    listingId: z.string(),
    way,
    /** "2h ago" */
    atLabel: z.string(),
    /** Their neighbourhood; empty for a guest. */
    area: z.string(),
    /** Not signed in: never asked about a deal. */
    guest: z.boolean(),
    deal: z.enum(['waiting', 'asked', 'confirmed']),
    daysToAsk: z.number().optional(),
    dealId: z.string().optional(),
  })
  .openapi('NumberReveal');

function atLabel(at: Date): string {
  const minutes = Math.floor((Date.now() - at.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return `${Math.floor(hours / 24)} days ago`;
}

const storeReveals = createRoute({
  method: 'get',
  path: '/stores/{id}/reveals',
  tags: ['Stores'],
  summary: 'A store\'s number reveals',
  description:
    'Who saw how to reach the store on its listings, newest first: one row for each person (or guest device) and listing, with the way they chose first and where the deal check stands. Names only once that person says a deal happened. Its owner and staff only, while a store pass covers now.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: 'The reveals',
      content: {
        'application/json': {
          schema: z.object({ reveals: z.array(RevealSchema), listings: z.array(ListingSchema) }),
        },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    402: { description: 'No store pass covers now', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not the store\'s owner or staff', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

revealRoutes.openapi(storeReveals, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser')!);
  if (!(await isMember(person.id, id))) {
    return c.json({ error: 'Only the store\'s owner and staff can see its reveals.' }, 403);
  }
  if (!(await paidUntil(id))) return c.json({ error: 'The Store console needs a store pass.', code: 'pass' }, 402);

  const rows = await db
    .select({ reveal: t.reveals })
    .from(t.reveals)
    .innerJoin(t.listings, eq(t.listings.id, t.reveals.listingId))
    .where(and(eq(t.listings.storeId, id), ne(t.listings.status, 'removed')))
    .orderBy(desc(t.reveals.createdAt))
    .limit(500);

  // One row for each person (or device) and listing: its newest time, its
  // first way.
  const groups = new Map<string, { latest: typeof t.reveals.$inferSelect; first: typeof t.reveals.$inferSelect }>();
  for (const { reveal } of rows) {
    const key = `${reveal.listingId}:${reveal.viewerId ?? reveal.deviceHash}`;
    const group = groups.get(key);
    if (!group) groups.set(key, { latest: reveal, first: reveal });
    else group.first = reveal;
  }

  const viewerIds = [...new Set(rows.flatMap(({ reveal }) => (reveal.viewerId ? [reveal.viewerId] : [])))];
  const people = viewerIds.length
    ? await db
        .select({ id: t.people.id, displayName: t.people.displayName, location: t.people.location })
        .from(t.people)
        .where(inArray(t.people.id, viewerIds))
    : [];
  const listingIds = [...new Set(rows.map(({ reveal }) => reveal.listingId))];
  const checks = viewerIds.length
    ? await db
        .select()
        .from(t.dealChecks)
        .where(
          and(
            eq(t.dealChecks.source, 'reveal'),
            inArray(t.dealChecks.listingId, listingIds),
            inArray(t.dealChecks.askerId, viewerIds),
          ),
        )
    : [];
  const confirmedOf = (personId: string) =>
    checks.filter((check) => check.askerId === personId && check.state === 'confirmed').length;

  const now = Date.now();
  const reveals = [...groups.values()].map(({ latest, first }) => {
    const viewer = latest.viewerId ? people.find((p) => p.id === latest.viewerId) : undefined;
    const check = latest.viewerId
      ? checks.find((row) => row.listingId === latest.listingId && row.askerId === latest.viewerId)
      : undefined;
    const deal: 'waiting' | 'asked' | 'confirmed' =
      check?.state === 'confirmed'
        ? 'confirmed'
        : check?.askerAnswer === 'yes' && check.ownerAnswer === null
          ? 'asked'
          : 'waiting';
    const named = deal !== 'waiting' && viewer;
    return {
      id: latest.id,
      userId: named ? viewer.id : '',
      name: named ? viewer.displayName : undefined,
      confirmedDeals: named ? confirmedOf(viewer.id) : undefined,
      listingId: latest.listingId,
      way: (first.way ?? 'call') as 'whatsapp' | 'call' | 'email' | 'messenger',
      atLabel: atLabel(latest.createdAt),
      area: viewer?.location?.split(',')[0]?.trim() ?? '',
      guest: !latest.viewerId,
      deal,
      daysToAsk:
        deal === 'waiting' && check?.promptedAt
          ? Math.max(0, Math.ceil((check.promptedAt.getTime() - now) / DAY))
          : undefined,
      dealId: deal === 'asked' ? check?.id : undefined,
    };
  });

  const listings = listingIds.length ? await loadListings(inArray(t.listings.id, listingIds), 500) : [];
  return c.json({ reveals, listings }, 200);
});
