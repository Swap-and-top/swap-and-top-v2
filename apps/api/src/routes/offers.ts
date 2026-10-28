/**
 * Offers: a structured reply to a swap, a Wanted listing or a sale whose
 * poster shares their number only after accepting an offer. Not binding; it
 * opens a conversation the two finish themselves (docs/features/
 * swap-and-top.md).
 *
 * Sending one needs a sign in and a verified phone. The listing's owner
 * accepts or declines it; the one who sent it can withdraw it. Accepting one
 * starts a deal check for both of them. The other person is told of a new
 * offer and of its answer, in their notifications.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, desc, eq, inArray, ne, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { paidUntil } from '../passes';
import { ErrorSchema, ListingSchema } from '../schemas';
import { personFor } from './me';
import { isMember } from './post';
import { notify, notifyStore } from './notifications';

export const offerRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const condition = z.enum(['boxed-new', 'like-new', 'good', 'fair']);
const way = z.enum(['whatsapp', 'call', 'sms', 'email', 'messenger']);

const OfferSchema = z
  .object({
    id: z.string(),
    listingId: z.string(),
    fromUserId: z.string(),
    /** Set when it was sent as a store. */
    fromStoreId: z.string().optional(),
    item: z
      .object({ listingId: z.string().optional(), name: z.string(), condition: condition.optional() })
      .optional(),
    cashAmount: z.number(),
    cashFrom: z.enum(['owner', 'offerer', 'none']),
    message: z.string().optional(),
    reachOn: z.array(z.string()),
    state: z.enum(['pending', 'accepted', 'declined', 'withdrawn']),
    /** "3h ago", "Yesterday", "8 days ago". */
    sentLabel: z.string(),
    /** Already in its listing's offer count (every offer that stands). */
    counted: z.boolean(),
  })
  .openapi('Offer');

const HOUR = 60 * 60 * 1000;

function sentLabel(at: Date): string {
  const hours = Math.floor((Date.now() - at.getTime()) / HOUR);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return `${Math.floor(hours / 24)} days ago`;
}

function offerOut(row: typeof t.offers.$inferSelect): z.infer<typeof OfferSchema> {
  return {
    id: row.id,
    listingId: row.listingId,
    fromUserId: row.fromPersonId,
    fromStoreId: row.fromStoreId ?? undefined,
    item: row.itemName
      ? {
          listingId: row.itemListingId ?? undefined,
          name: row.itemName,
          condition: row.itemCondition ?? undefined,
        }
      : undefined,
    cashAmount: row.cashAmount,
    cashFrom: row.cashFrom,
    message: row.message ?? undefined,
    reachOn: row.reachOn,
    state: row.state,
    sentLabel: sentLabel(row.createdAt),
    counted: row.state !== 'withdrawn',
  };
}

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'No such offer or listing', content: { 'application/json': { schema: ErrorSchema } } },
  409: { description: 'Already done', content: { 'application/json': { schema: ErrorSchema } } },
};

/* --- your offers ---------------------------------------------------------- */

const mine = createRoute({
  method: 'get',
  path: '/me/offers',
  tags: ['Offers'],
  summary: 'Your offers',
  description: 'Offers you have sent, and offers on your listings, newest first, whatever became of them.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: { description: 'Your offers', content: { 'application/json': { schema: z.object({ offers: z.array(OfferSchema) }) } } },
    401: errors[401],
  },
});

offerRoutes.openapi(mine, async (c) => {
  const person = await personFor(c.get('authUser'));
  const theirs = db.select({ id: t.listings.id }).from(t.listings).where(eq(t.listings.ownerId, person.id));
  const rows = await db
    .select()
    .from(t.offers)
    .where(or(eq(t.offers.fromPersonId, person.id), inArray(t.offers.listingId, theirs)))
    .orderBy(desc(t.offers.createdAt));
  return c.json({ offers: rows.map(offerOut) }, 200);
});

/* --- sending one ---------------------------------------------------------- */

const send = createRoute({
  method: 'post',
  path: '/offers',
  tags: ['Offers'],
  summary: 'Send an offer',
  description: 'Needs a verified phone. One standing offer per listing; not on your own listing.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            listingId: z.string(),
            item: z
              .object({ listingId: z.string().optional(), name: z.string().trim().min(1).max(120), condition: condition.optional() })
              .optional(),
            cashAmount: z.number().min(0).max(1_000_000),
            cashFrom: z.enum(['owner', 'offerer', 'none']),
            message: z.string().trim().max(500).optional(),
            reachOn: z.array(way).optional(),
            /** Send it as this store, which they own or work for. */
            storeId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Sent', content: { 'application/json': { schema: OfferSchema } } },
    ...errors,
  },
});

offerRoutes.openapi(send, async (c) => {
  const body = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  if (!person.phoneVerifiedAt) return c.json({ error: 'Verify your phone number to send offers.' }, 403);
  if (person.standing === 'suspended' || person.standing === 'banned') {
    return c.json({ error: 'Your account cannot send offers right now.' }, 403);
  }
  const storeId = body.storeId ?? null;
  if (storeId && !(await isMember(person.id, storeId))) {
    return c.json({ error: 'You cannot send offers as that store.' }, 403);
  }
  const [listing] = await db.select().from(t.listings).where(eq(t.listings.id, body.listingId));
  if (!listing || listing.status !== 'live') return c.json({ error: 'That listing is not taking offers.' }, 404);
  if (listing.ownerId === person.id || (storeId && listing.storeId === storeId)) {
    return c.json({ error: 'That listing is yours.' }, 403);
  }
  if (storeId && !listing.allowStoreOffers) {
    return c.json({ error: 'This person has turned off store offers.' }, 403);
  }
  // One standing offer each: from the person, or from the store.
  const [standing] = await db
    .select({ id: t.offers.id })
    .from(t.offers)
    .where(
      and(
        eq(t.offers.listingId, listing.id),
        storeId ? eq(t.offers.fromStoreId, storeId) : eq(t.offers.fromPersonId, person.id),
        inArray(t.offers.state, ['pending', 'accepted']),
      ),
    );
  if (standing) return c.json({ error: 'You already have an offer on this listing.' }, 409);
  const [store] = storeId
    ? await db.select({ name: t.stores.name }).from(t.stores).where(eq(t.stores.id, storeId))
    : [];

  const [offer] = await db
    .insert(t.offers)
    .values({
      listingId: listing.id,
      fromPersonId: person.id,
      fromStoreId: storeId,
      itemListingId: body.item?.listingId ?? null,
      itemName: body.item?.name ?? null,
      itemCondition: body.item?.condition ?? null,
      cashAmount: body.cashAmount,
      cashFrom: body.cashFrom,
      message: body.message || null,
      reachOn: body.reachOn ?? [],
    })
    .returning();
  // A store's listing: the store is told, in its console; else the poster.
  const said = `${store?.name ?? (person.displayName || 'Someone')} made an offer on your ${listing.title}`;
  if (listing.storeId) await notifyStore(listing.storeId, 'offer', said, '/console/trade-ins');
  else await notify(listing.ownerId, 'offer', said, '/me/offers');
  return c.json(offerOut(offer!), 201);
});

/* --- answering or withdrawing one ------------------------------------------ */

const change = createRoute({
  method: 'patch',
  path: '/offers/{id}',
  tags: ['Offers'],
  summary: 'Accept, decline, withdraw or take back an answer',
  description:
    'The listing owner accepts or declines a pending offer; the one who sent it withdraws it. Accepting starts a deal check for both. pending takes an answer back: a decline at any time, an accept only within a minute, before anything is shared.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ state: z.enum(['pending', 'accepted', 'declined', 'withdrawn']) }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Changed', content: { 'application/json': { schema: OfferSchema } } },
    ...errors,
  },
});

offerRoutes.openapi(change, async (c) => {
  const { id } = c.req.valid('param');
  const next = c.req.valid('json').state;
  const person = await personFor(c.get('authUser'));
  const [row] = await db
    .select({ offer: t.offers, ownerId: t.listings.ownerId, storeId: t.listings.storeId, title: t.listings.title })
    .from(t.offers)
    .innerJoin(t.listings, eq(t.listings.id, t.offers.listingId))
    .where(eq(t.offers.id, id));
  if (!row) return c.json({ error: 'That offer is not there any more.' }, 404);
  const { offer, ownerId, storeId, title } = row;
  // The listing's poster answers, or anyone running the store it is posted
  // as; the sender withdraws, or anyone running the store it was sent as.
  const answers = ownerId === person.id || (storeId !== null && (await isMember(person.id, storeId)));
  const sent =
    offer.fromPersonId === person.id ||
    (offer.fromStoreId !== null && (await isMember(person.id, offer.fromStoreId)));

  if (next === 'withdrawn') {
    if (!sent) return c.json({ error: 'Only the one who sent it can withdraw it.' }, 403);
    if (offer.state === 'withdrawn') return c.json({ error: 'It is already withdrawn.' }, 409);
  } else if (next === 'pending') {
    // Taking an answer back: the owner's undo.
    if (!answers) return c.json({ error: 'Only the listing owner can change the answer.' }, 403);
    const recent = offer.answeredAt !== null && Date.now() - offer.answeredAt.getTime() < 60 * 1000;
    if (!(offer.state === 'declined' || (offer.state === 'accepted' && recent))) {
      return c.json({ error: 'That answer cannot be taken back now.' }, 409);
    }
  } else {
    if (!answers) return c.json({ error: 'Only the listing owner can answer it.' }, 403);
    if (offer.state !== 'pending') return c.json({ error: 'That offer has already been answered.' }, 409);
  }

  const now = new Date();
  const updated = await db.transaction(async (tx) => {
    const [changed] = await tx
      .update(t.offers)
      .set({
        state: next,
        ...(next === 'withdrawn' ? {} : { answeredAt: next === 'pending' ? null : now }),
      })
      .where(and(eq(t.offers.id, id), ne(t.offers.state, next)))
      .returning();
    if (next === 'pending' && offer.state === 'accepted') {
      // The accept undone: its deal check goes too.
      await tx.delete(t.dealChecks).where(eq(t.dealChecks.offerId, id));
    }
    if (next === 'accepted') {
      // Both are asked whether the deal went through, three days on; it
      // lapses quietly two weeks after the acceptance.
      await tx
        .insert(t.dealChecks)
        .values({
          source: 'offer',
          offerId: id,
          listingId: offer.listingId,
          askerId: offer.fromPersonId,
          ownerId,
          promptedAt: new Date(now.getTime() + 3 * 24 * HOUR),
          lapsesAt: new Date(now.getTime() + 14 * 24 * HOUR),
        })
        .onConflictDoNothing();
    }
    return changed!;
  });
  if (next === 'accepted' || next === 'declined') {
    // Answered for a store: the store's name, not the one who answered.
    const [store] = storeId
      ? await db.select({ name: t.stores.name }).from(t.stores).where(eq(t.stores.id, storeId))
      : [];
    // Sent as a store: the store is told, in its console; else the sender.
    const said = `${store?.name ?? (person.displayName || 'The owner')} ${next} your offer on the ${title}`;
    if (offer.fromStoreId) await notifyStore(offer.fromStoreId, 'offer-reply', said, '/console/trade-ins');
    else await notify(offer.fromPersonId, 'offer-reply', said, '/me/offers');
  }
  return c.json(offerOut(updated), 200);
});

/* --- a store's offers, for the Store console ------------------------------- */

const storeOffers = createRoute({
  method: 'get',
  path: '/stores/{id}/offers',
  tags: ['Offers'],
  summary: 'A store\'s offers',
  description:
    'Offers on the store\'s listings, and offers sent as the store, newest first, whatever became of them, with the listings they are on. Its owner and staff only, while a store pass covers now.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: 'The store\'s offers',
      content: {
        'application/json': {
          schema: z.object({ offers: z.array(OfferSchema), listings: z.array(ListingSchema) }),
        },
      },
    },
    401: errors[401],
    402: { description: 'No store pass covers now', content: { 'application/json': { schema: ErrorSchema } } },
    403: errors[403],
  },
});

offerRoutes.openapi(storeOffers, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  if (!(await isMember(person.id, id))) {
    return c.json({ error: 'Only the store\'s owner and staff can see its offers.' }, 403);
  }
  if (!(await paidUntil(id))) return c.json({ error: 'The Store console needs a store pass.', code: 'pass' }, 402);
  const stock = db.select({ id: t.listings.id }).from(t.listings).where(eq(t.listings.storeId, id));
  const rows = await db
    .select()
    .from(t.offers)
    .where(or(eq(t.offers.fromStoreId, id), inArray(t.offers.listingId, stock)))
    .orderBy(desc(t.offers.createdAt));
  const ids = [...new Set(rows.map((row) => row.listingId))];
  const listings = ids.length ? await loadListings(inArray(t.listings.id, ids), 500) : [];
  return c.json({ offers: rows.map(offerOut), listings }, 200);
});
