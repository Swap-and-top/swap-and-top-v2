/**
 * A person's own listings: posting one, listing theirs for My listings, and
 * what the owner does to one (pause, mark sold, delete, relist).
 *
 * Posting saves what the posting flow's three steps gathered as the item (or
 * items), the listing and its sale, swap or Wanted details, in one go. It
 * goes live straight away and expires in 30 days.
 *
 * Posting needs a sign in and a verified phone (docs/architecture/
 * auth-and-identity.md); the app asks for the phone first, and this checks it
 * again. Someone with a store can post as the store (`storeId`).
 *
 * The limits (docs/product/accounts-and-stores.md): live listings for sale or
 * swap, 5 for a person and 15 for a free store; a store with a pass that
 * covers today has none. Wanted listings never count. At a limit the answer
 * is a 403 with `code: 'limit'`, which the app turns into its limit message.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, eq, gt, inArray, isNull, lte, notInArray } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { ErrorSchema, ListingSchema } from '../schemas';
import { personFor } from './me';

export const postRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const category = z.enum(['phones', 'laptops', 'desktops', 'consoles', 'parts', 'accessories', 'other']);
const money = z.number().positive().max(1_000_000);

const NewListing = z
  .object({
    kind: z.enum(['sale', 'swap', 'request']),
    /** Post as this store, which they own or work for. Missing: as themselves. */
    storeId: z.string().optional(),
    category,
    /** What they have: a sale's item, a swap's own side. */
    haveTitle: z.string().trim().max(80).optional(),
    specs: z.record(z.string(), z.string()).optional(),
    condition: z.enum(['boxed-new', 'like-new', 'good', 'fair']).optional(),
    /** What they want: a swap's other side, a Wanted listing. */
    wantTitle: z.string().trim().max(80).optional(),
    price: money.optional(),
    acceptsSwaps: z.boolean().optional(),
    budget: money.optional(),
    cashDirection: z.enum(['i-add', 'they-add', 'straight']).optional(),
    cashAmount: money.optional(),
    cashUpTo: z.boolean().optional(),
    contactChannels: z.array(z.enum(['whatsapp', 'call', 'email', 'messenger'])).min(1, 'Choose at least one way to reach you'),
    allowStoreOffers: z.boolean(),
    contactSignedInOnly: z.boolean(),
    contactShownTo: z.enum(['everyone', 'offers']),
    contactToStores: z.boolean(),
  })
  .openapi('NewListing');

const PERSON_LIMIT = 5;
const FREE_STORE_LIMIT = 15;

/**
 * Why one more live listing for sale or swap may not go up, as the person
 * or as the store: null when it may.
 */
async function overLimit(personId: string, storeId: string | null): Promise<string | null> {
  const now = new Date();
  if (storeId) {
    const [pass] = await db
      .select({ id: t.storePasses.id })
      .from(t.storePasses)
      .where(and(eq(t.storePasses.storeId, storeId), lte(t.storePasses.startsAt, now), gt(t.storePasses.endsAt, now)));
    if (pass) return null;
  }
  const [live] = await db
    .select({ n: count() })
    .from(t.listings)
    .where(
      and(
        eq(t.listings.status, 'live'),
        inArray(t.listings.type, ['sale', 'swap']),
        storeId
          ? eq(t.listings.storeId, storeId)
          : and(eq(t.listings.ownerId, personId), isNull(t.listings.storeId)),
      ),
    );
  const n = live?.n ?? 0;
  if (storeId) {
    return n >= FREE_STORE_LIMIT
      ? `Your store has ${n} live listings, the most for a free store. Get a store pass to post more, or mark one as sold.`
      : null;
  }
  return n >= PERSON_LIMIT
    ? `You have ${n} live listings, the most for a personal account. Open a store to post more, or mark one as sold.`
    : null;
}

/** Whether this person may act for this store: its owner or staff. */
async function isMember(personId: string, storeId: string): Promise<boolean> {
  const [member] = await db
    .select({ role: t.storeMembers.role })
    .from(t.storeMembers)
    .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
    .where(
      and(
        eq(t.storeMembers.storeId, storeId),
        eq(t.storeMembers.personId, personId),
        isNull(t.storeMembers.removedAt),
        isNull(t.stores.closedAt),
      ),
    );
  return Boolean(member);
}

const post = createRoute({
  method: 'post',
  path: '/listings',
  tags: ['Listings'],
  summary: 'Post a listing',
  description: 'Needs a sign in and a verified phone. Goes live straight away; expires in 30 days.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { body: { content: { 'application/json': { schema: NewListing } } } },
  responses: {
    201: {
      description: 'Posted',
      content: { 'application/json': { schema: z.object({ id: z.string(), slug: z.string() }) } },
    },
    400: { description: 'Something is missing', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'No verified phone, or not allowed to post', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

/** "ThinkPad T480", "Avondale" → "thinkpad-t480-avondale-3f9a": readable, and never the same twice. */
function slugFor(title: string, area: string): string {
  const words = `${title} ${area}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${words}-${crypto.randomUUID().slice(0, 4)}`;
}

postRoutes.openapi(post, async (c) => {
  const body = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  if (!person.phoneVerifiedAt) {
    return c.json({ error: 'Verify your phone number to post listings.' }, 403);
  }
  if (person.standing === 'suspended' || person.standing === 'banned') {
    return c.json({ error: 'Your account cannot post listings right now.' }, 403);
  }

  const storeId = body.storeId ?? null;
  if (storeId && !(await isMember(person.id, storeId))) {
    return c.json({ error: 'You cannot post as that store.' }, 403);
  }
  if (body.kind !== 'request') {
    const problem = await overLimit(person.id, storeId);
    if (problem) return c.json({ error: problem, code: 'limit' }, 403);
  }

  const have = body.haveTitle ?? '';
  const want = body.wantTitle ?? '';
  if (body.kind !== 'request' && !have) return c.json({ error: 'Say what you have.' }, 400);
  if (body.kind !== 'sale' && !want) return c.json({ error: 'Say what you want.' }, 400);
  if (body.kind === 'sale' && !body.price) return c.json({ error: 'Enter a price.' }, 400);
  if (body.kind === 'request' && !body.budget) return c.json({ error: 'Enter a budget.' }, 400);
  const direction = body.cashDirection ?? 'straight';
  if (body.kind === 'swap' && direction !== 'straight' && !body.cashAmount) {
    return c.json({ error: 'Enter how much cash.' }, 400);
  }

  const title = body.kind === 'sale' ? have : body.kind === 'swap' ? `${have} for ${want}` : want;
  // Their neighbourhood, from "Avondale, Harare"; Harare until they have one.
  const area = person.location?.split(',')[0]?.trim() || 'Harare';
  const now = new Date();

  const posted = await db.transaction(async (tx) => {
    const newItem = async (name: string, wanted: boolean) => {
      const [item] = await tx
        .insert(t.items)
        .values({
          category: body.category,
          name,
          condition: wanted ? null : (body.condition ?? null),
          specs: wanted ? {} : (body.specs ?? {}),
          wanted,
        })
        .returning({ id: t.items.id });
      return item!.id;
    };

    const [listing] = await tx
      .insert(t.listings)
      .values({
        slug: slugFor(body.kind === 'request' ? `wanted ${title}` : title, area),
        type: body.kind,
        ownerId: person.id,
        storeId,
        category: body.category,
        title,
        location: area,
        status: 'live',
        publishedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        contactChannels: body.contactChannels,
        contactSignedInOnly: body.contactSignedInOnly,
        contactShownTo: body.contactShownTo,
        contactToStores: body.contactToStores,
        allowStoreOffers: body.allowStoreOffers,
      })
      .returning({ id: t.listings.id, slug: t.listings.slug });

    if (body.kind === 'sale') {
      await tx.insert(t.saleDetails).values({
        listingId: listing!.id,
        itemId: await newItem(have, false),
        price: body.price!,
        acceptsSwaps: body.acceptsSwaps ?? false,
      });
    } else if (body.kind === 'swap') {
      await tx.insert(t.swapDetails).values({
        listingId: listing!.id,
        hasItemId: await newItem(have, false),
        wantsItemId: await newItem(want, true),
        cashDirection: direction,
        cashAmount: direction === 'straight' ? null : body.cashAmount!,
        cashUpTo: direction === 'i-add' && (body.cashUpTo ?? false),
      });
    } else {
      await tx.insert(t.requestDetails).values({
        listingId: listing!.id,
        wantsItemId: await newItem(want, true),
        budget: body.budget!,
      });
    }
    return listing!;
  });

  return c.json(posted, 201);
});

const mine = createRoute({
  method: 'get',
  path: '/me/listings',
  tags: ['Listings'],
  summary: 'Your listings',
  description: 'Everything you have posted and not deleted, newest first: live, paused, sold and expired.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'Your listings',
      content: { 'application/json': { schema: z.object({ listings: z.array(ListingSchema) }) } },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

postRoutes.openapi(mine, async (c) => {
  const person = await personFor(c.get('authUser'));
  const listings = await loadListings(
    and(eq(t.listings.ownerId, person.id), notInArray(t.listings.status, ['withdrawn', 'removed'])),
    200,
  );
  return c.json({ listings }, 200);
});

const status = createRoute({
  method: 'patch',
  path: '/listings/{id}/status',
  tags: ['Listings'],
  summary: 'Pause, mark sold, delete or relist your listing',
  description:
    'live relists it (back in the feed for another 30 days), paused takes it down for a while, sold marks it sold, withdrawn deletes it for good.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ status: z.enum(['live', 'paused', 'sold', 'withdrawn']) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Changed',
      content: { 'application/json': { schema: z.object({ id: z.string(), slug: z.string(), status: z.string() }) } },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: {
      description: 'Not your listing, or at a listing limit',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: { description: 'No such listing', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

postRoutes.openapi(status, async (c) => {
  const { id } = c.req.valid('param');
  const next = c.req.valid('json').status;
  const person = await personFor(c.get('authUser'));
  const [listing] = await db.select().from(t.listings).where(eq(t.listings.id, id));
  if (!listing || listing.status === 'withdrawn' || listing.status === 'removed') {
    return c.json({ error: 'That listing is not there any more.' }, 404);
  }
  if (listing.ownerId !== person.id) return c.json({ error: 'That listing is not yours.' }, 403);
  // Relisting puts it back among the live ones, so the limit applies.
  if (next === 'live' && listing.status !== 'live' && listing.type !== 'request') {
    const problem = await overLimit(person.id, listing.storeId);
    if (problem) return c.json({ error: problem, code: 'limit' }, 403);
  }

  const now = new Date();
  const [changed] = await db
    .update(t.listings)
    .set({
      status: next,
      updatedAt: now,
      ...(next === 'sold' ? { soldAt: now } : {}),
      // Relisted: back in the feed as new, for another 30 days.
      ...(next === 'live'
        ? { publishedAt: now, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), soldAt: null }
        : {}),
    })
    .where(eq(t.listings.id, id))
    .returning({ id: t.listings.id, slug: t.listings.slug, status: t.listings.status });
  return c.json(changed!, 200);
});
