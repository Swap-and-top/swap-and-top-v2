/**
 * Stores: a store's public page, and opening one. A store is something a
 * person opens and runs from their account (docs/product/
 * accounts-and-stores.md); the one who opens it is its owner.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, eq, isNull, notInArray } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { buyPass, dayMonth, paidUntil, PASSES, settlePasses } from '../passes';
import { isMember } from './post';
import { ErrorSchema, ListingSchema, StoreSchema } from '../schemas';
import { personFor } from './me';

export const storeRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const bySlug = createRoute({
  method: 'get',
  path: '/stores/{slug}',
  tags: ['Stores'],
  summary: 'Get a store',
  description: 'The store page, with its live listings. Closed stores are not found.',
  request: {
    params: z.object({
      slug: z.string().openapi({ example: 'kopje-computers' }),
    }),
  },
  responses: {
    200: {
      description: 'The store',
      content: { 'application/json': { schema: StoreSchema } },
    },
    404: {
      description: 'No such store',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

/** A store's page: who they are, their trust numbers and live listings.
    Undefined for a closed or unknown store. */
export async function storeBySlug(slug: string) {
  await settlePasses();
  const [store] = await db
    .select()
    .from(t.stores)
    .where(and(eq(t.stores.slug, slug), isNull(t.stores.closedAt)));
  if (!store) return undefined;

  const listings = await loadListings(
    and(eq(t.listings.storeId, store.id), eq(t.listings.status, 'live')),
  );

  // Deals both sides confirmed, on anything the store has listed.
  const [deals] = await db
    .select({ n: count() })
    .from(t.dealChecks)
    .innerJoin(t.listings, eq(t.listings.id, t.dealChecks.listingId))
    .where(and(eq(t.listings.storeId, store.id), eq(t.dealChecks.state, 'confirmed')));

  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    initials: store.initials,
    description: store.description,
    location: store.location,
    openingHours: store.openingHours,
    verified: store.verifiedAt !== null,
    stockCount: listings.filter((l) => l.type === 'sale' || l.type === 'swap').length,
    confirmedDeals: deals?.n ?? 0,
    // Not measured yet: "< 1h" until reply times are.
    replyHours: 1,
    joinedAt: store.createdAt.toISOString().slice(0, 10),
    listings,
  };
}

storeRoutes.openapi(bySlug, async (c) => {
  const { slug } = c.req.valid('param');
  const store = await storeBySlug(slug);
  if (!store) return c.json({ error: 'Store not found' }, 404);
  return c.json(store, 200);
});

/** Every open store's address, for building their pages ahead. */
export async function storeSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: t.stores.slug }).from(t.stores).where(isNull(t.stores.closedAt));
  return rows.map((row) => row.slug);
}

/* --- opening one ---------------------------------------------------------- */

/** "Kopje Computers" → "KC"; "Samora" → "SA". */
function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word));
  const letters =
    words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? 'ST').slice(0, 2);
  return letters.toUpperCase();
}

const open = createRoute({
  method: 'post',
  path: '/stores',
  tags: ['Stores'],
  summary: 'Open a store',
  description:
    'A person opens a store from their account and becomes its owner. It starts as a free store: up to 15 live listings for sale or swap. A person can own up to 3 stores.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().trim().min(2, 'Give the store a name').max(60),
            location: z.string().trim().min(2, 'Say where the store is').max(100),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Opened',
      content: { 'application/json': { schema: z.object({ id: z.string(), slug: z.string() }) } },
    },
    400: { description: 'Something is missing', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Already owns 3 stores', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

storeRoutes.openapi(open, async (c) => {
  const { name, location } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const [owned] = await db
    .select({ n: count() })
    .from(t.storeMembers)
    .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
    .where(
      and(
        eq(t.storeMembers.personId, person.id),
        eq(t.storeMembers.role, 'owner'),
        isNull(t.storeMembers.removedAt),
        isNull(t.stores.closedAt),
      ),
    );
  if ((owned?.n ?? 0) >= 3) return c.json({ error: 'A person can own up to 3 stores.' }, 403);

  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'store';
  const [taken] = await db.select({ id: t.stores.id }).from(t.stores).where(eq(t.stores.slug, base));
  // "new" is the Open a store page's own address.
  const slug = taken || base === 'new' ? `${base}-${crypto.randomUUID().slice(0, 4)}` : base;

  const made = await db.transaction(async (tx) => {
    const [store] = await tx
      .insert(t.stores)
      .values({ slug, name, initials: initialsOf(name), location })
      .returning({ id: t.stores.id, slug: t.stores.slug });
    await tx.insert(t.storeMembers).values({ storeId: store!.id, personId: person.id, role: 'owner' });
    return store!;
  });
  return c.json(made, 201);
});

/* --- store passes ---------------------------------------------------------- */

const pass = createRoute({
  method: 'post',
  path: '/stores/{id}/passes',
  tags: ['Stores'],
  summary: 'Buy a store pass',
  description:
    'The store owner buys a pass: day ($1), week ($5) or month ($15). While a pass covers now the store has no listing limit, the Store console and lead alerts. Bought while one runs, it starts where that ends. Every listing paused when the last pass ended goes live again. A test payment, recorded as paid at once, until Paynow is set up.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ kind: z.enum(['day', 'week', 'month']) }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Paid',
      content: {
        'application/json': {
          schema: z.object({
            endsAt: z.string(),
            /** "10 Nov" */
            endsLabel: z.string(),
            amount: z.number(),
            /** Listings paused by the last lapse, live again. */
            restored: z.number(),
          }),
        },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not the store\'s owner', content: { 'application/json': { schema: ErrorSchema } } },
    404: { description: 'No such store', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

storeRoutes.openapi(pass, async (c) => {
  const { id } = c.req.valid('param');
  const { kind } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const [store] = await db
    .select({ id: t.stores.id })
    .from(t.stores)
    .where(and(eq(t.stores.id, id), isNull(t.stores.closedAt)));
  if (!store) return c.json({ error: 'Store not found' }, 404);
  const [owner] = await db
    .select({ personId: t.storeMembers.personId })
    .from(t.storeMembers)
    .where(
      and(
        eq(t.storeMembers.storeId, id),
        eq(t.storeMembers.personId, person.id),
        eq(t.storeMembers.role, 'owner'),
        isNull(t.storeMembers.removedAt),
      ),
    );
  if (!owner) return c.json({ error: 'Only the store\'s owner can buy its pass.' }, 403);

  const { endsAt, restored } = await buyPass(person.id, id, kind);
  return c.json(
    { endsAt: endsAt.toISOString(), endsLabel: dayMonth(endsAt), amount: PASSES[kind].price, restored },
    201,
  );
});

/* --- the Store console's stock -------------------------------------------- */

const stock = createRoute({
  method: 'get',
  path: '/stores/{id}/stock',
  tags: ['Stores'],
  summary: 'A store\'s stock',
  description:
    'Everything the store has listed and not deleted, in every state, newest first, for the Store console. Its owner and staff only, while a store pass covers now.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: 'The stock',
      content: {
        'application/json': {
          schema: z.object({
            /** "26 Nov": when the store's paid time ends. */
            paidUntil: z.string(),
            listings: z.array(ListingSchema),
          }),
        },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    402: { description: 'No store pass covers now', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not the store\'s owner or staff', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

storeRoutes.openapi(stock, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  if (!(await isMember(person.id, id))) {
    return c.json({ error: 'Only the store\'s owner and staff can see its stock here.' }, 403);
  }
  await settlePasses();
  const until = await paidUntil(id);
  if (!until) return c.json({ error: 'The Store console needs a store pass.', code: 'pass' }, 402);
  const listings = await loadListings(
    and(eq(t.listings.storeId, id), notInArray(t.listings.status, ['withdrawn', 'removed'])),
    500,
  );
  return c.json({ paidUntil: dayMonth(until), listings }, 200);
});
