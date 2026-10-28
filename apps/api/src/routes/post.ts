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
import { and, count, eq, inArray, isNull, notInArray } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { FREE_STORE_LIMIT, paidUntil, settlePasses } from '../passes';
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
    /** A sale: how many of this model a store holds. */
    stockCount: z.number().int().positive().max(9999).optional(),
    /** Kept as a draft, not listed: a store's stock not ready yet. A draft
        sale may have no price. */
    draft: z.boolean().optional(),
  })
  .openapi('NewListing');

const PERSON_LIMIT = 5;

/**
 * Why one more live listing for sale or swap may not go up, as the person
 * or as the store: null when it may.
 */
async function overLimit(personId: string, storeId: string | null): Promise<string | null> {
  await settlePasses();
  if (storeId && (await paidUntil(storeId))) return null;
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
export async function isMember(personId: string, storeId: string): Promise<boolean> {
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
  const draft = body.draft ?? false;
  // A draft is not live, so it does not count toward a limit.
  if (body.kind !== 'request' && !draft) {
    const problem = await overLimit(person.id, storeId);
    if (problem) return c.json({ error: problem, code: 'limit' }, 403);
  }

  const have = body.haveTitle ?? '';
  const want = body.wantTitle ?? '';
  if (body.kind !== 'request' && !have) return c.json({ error: 'Say what you have.' }, 400);
  if (body.kind !== 'sale' && !want) return c.json({ error: 'Say what you want.' }, 400);
  if (body.kind === 'sale' && !body.price && !draft) return c.json({ error: 'Enter a price.' }, 400);
  if (body.kind === 'request' && !body.budget) return c.json({ error: 'Enter a budget.' }, 400);
  const direction = body.cashDirection ?? 'straight';
  if (body.kind === 'swap' && direction !== 'straight' && !body.cashAmount) {
    return c.json({ error: 'Enter how much cash.' }, 400);
  }

  const title = body.kind === 'sale' ? have : body.kind === 'swap' ? `${have} for ${want}` : want;
  // Where it is: the store's neighbourhood for a store's listing, else the
  // poster's, from "Avondale, Harare"; Harare until there is one.
  const [store] = storeId
    ? await db.select({ location: t.stores.location }).from(t.stores).where(eq(t.stores.id, storeId))
    : [];
  const area = (store?.location ?? person.location)?.split(',')[0]?.trim() || 'Harare';
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
        status: draft ? 'draft' : 'live',
        publishedAt: draft ? null : now,
        expiresAt: draft ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
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
        // A draft with no price yet holds 0, shown as "No price yet".
        price: body.price ?? 0,
        stockCount: body.stockCount ?? null,
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

/* --- a store's whole list at once ------------------------------------------ */

const ImportRow = z.object({
  title: z.string().trim().min(1).max(80),
  category,
  condition: z.enum(['boxed-new', 'like-new', 'good', 'fair']).optional(),
  /** None: it waits as a draft until priced. */
  price: money.optional(),
  quantity: z.number().int().positive().max(9999).optional(),
  specs: z.record(z.string(), z.string()).optional(),
});

const importStock = createRoute({
  method: 'post',
  path: '/stores/{id}/stock/import',
  tags: ['Stores'],
  summary: 'Bulk import stock',
  description:
    'A store\'s list, up to 500 items, added as the store in one go: those with a price go live, those without wait as drafts. Its owner and staff, while a store pass covers now.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: z.object({ rows: z.array(ImportRow).min(1).max(500) }) } } },
  },
  responses: {
    201: {
      description: 'Imported',
      content: { 'application/json': { schema: z.object({ live: z.number(), drafts: z.number() }) } },
    },
    400: { description: 'Something is wrong with the list', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    402: { description: 'No store pass covers now', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not allowed to post as the store', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

postRoutes.openapi(importStock, async (c) => {
  const { id: storeId } = c.req.valid('param');
  const { rows } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  if (!person.phoneVerifiedAt) {
    return c.json({ error: 'Verify your phone number to post listings.' }, 403);
  }
  if (person.standing === 'suspended' || person.standing === 'banned') {
    return c.json({ error: 'Your account cannot post listings right now.' }, 403);
  }
  if (!(await isMember(person.id, storeId))) {
    return c.json({ error: 'You cannot post as that store.' }, 403);
  }
  // With a pass there is no limit, so the whole list can go live.
  await settlePasses();
  if (!(await paidUntil(storeId))) return c.json({ error: 'Bulk import needs a store pass.', code: 'pass' }, 402);

  const [store] = await db.select({ location: t.stores.location }).from(t.stores).where(eq(t.stores.id, storeId));
  const area = store?.location?.split(',')[0]?.trim() || 'Harare';
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Ids set here, so each row's item, listing and sale stay together.
  const ids = rows.map(() => ({ item: crypto.randomUUID(), listing: crypto.randomUUID() }));
  await db.transaction(async (tx) => {
    await tx.insert(t.items).values(
      rows.map((row, index) => ({
        id: ids[index]!.item,
        category: row.category,
        name: row.title,
        condition: row.condition ?? null,
        specs: row.specs ?? {},
        wanted: false,
      })),
    );
    await tx.insert(t.listings).values(
      rows.map((row, index) => ({
        id: ids[index]!.listing,
        slug: slugFor(row.title, area),
        type: 'sale' as const,
        ownerId: person.id,
        storeId,
        category: row.category,
        title: row.title,
        location: area,
        status: row.price ? ('live' as const) : ('draft' as const),
        publishedAt: row.price ? now : null,
        expiresAt: row.price ? expires : null,
        // Reached as the store's other stock is, until it has its own ways.
        contactChannels: ['whatsapp' as const, 'call' as const],
        contactSignedInOnly: false,
        contactShownTo: 'everyone' as const,
        contactToStores: false,
        allowStoreOffers: true,
      })),
    );
    await tx.insert(t.saleDetails).values(
      rows.map((row, index) => ({
        listingId: ids[index]!.listing,
        itemId: ids[index]!.item,
        // A draft with no price yet holds 0, shown as "No price yet".
        price: row.price ?? 0,
        stockCount: row.quantity ?? null,
        acceptsSwaps: false,
      })),
    );
  });

  const live = rows.filter((row) => row.price).length;
  return c.json({ live, drafts: rows.length - live }, 201);
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

/* --- editing a sale ---------------------------------------------------- */

const editSale = createRoute({
  method: 'patch',
  path: '/listings/{id}',
  tags: ['Listings'],
  summary: 'Edit a listing for sale',
  description:
    'Changes a sale\'s item and terms in place: name, category, condition, details, price, how many are held and whether it accepts swaps. Its address stays the same. With `publish`, a draft with a price is listed (the listing limits apply). Its poster, or the owner or staff of the store it was posted as.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().trim().min(1, 'Say what it is').max(80),
            category,
            condition: z.enum(['boxed-new', 'like-new', 'good', 'fair']),
            specs: z.record(z.string(), z.string()),
            price: money.optional(),
            stockCount: z.number().int().positive().max(9999).optional(),
            acceptsSwaps: z.boolean(),
            /** List a draft, now that it has a price. */
            publish: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Saved',
      content: { 'application/json': { schema: z.object({ id: z.string(), slug: z.string(), status: z.string() }) } },
    },
    400: { description: 'Something is missing', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not yours, or at a listing limit', content: { 'application/json': { schema: ErrorSchema } } },
    404: { description: 'No such listing for sale', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

postRoutes.openapi(editSale, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const [listing] = await db.select().from(t.listings).where(eq(t.listings.id, id));
  if (!listing || listing.type !== 'sale' || listing.status === 'withdrawn' || listing.status === 'removed') {
    return c.json({ error: 'That listing is not there any more.' }, 404);
  }
  const allowed =
    listing.ownerId === person.id ||
    (listing.storeId !== null && (await isMember(person.id, listing.storeId)));
  if (!allowed) return c.json({ error: 'That listing is not yours.' }, 403);

  const publish = listing.status === 'draft' && (body.publish ?? false);
  // Listed, it needs a price; a draft may wait for one.
  if ((listing.status !== 'draft' || publish) && !body.price) {
    return c.json({ error: 'Enter a price.' }, 400);
  }
  if (publish) {
    const problem = await overLimit(person.id, listing.storeId);
    if (problem) return c.json({ error: problem, code: 'limit' }, 403);
  }

  const [sale] = await db.select().from(t.saleDetails).where(eq(t.saleDetails.listingId, id));
  if (!sale) return c.json({ error: 'That listing is not there any more.' }, 404);
  const now = new Date();
  const price = body.price ?? 0;

  const saved = await db.transaction(async (tx) => {
    await tx
      .update(t.items)
      .set({ name: body.title, category: body.category, condition: body.condition, specs: body.specs })
      .where(eq(t.items.id, sale.itemId));
    await tx
      .update(t.saleDetails)
      .set({
        price,
        // A lower price shows the old one struck through on the card.
        previousPrice: sale.price > 0 && price > 0 && price < sale.price ? sale.price : sale.previousPrice,
        stockCount: body.stockCount ?? null,
        acceptsSwaps: body.acceptsSwaps,
      })
      .where(eq(t.saleDetails.listingId, id));
    const [changed] = await tx
      .update(t.listings)
      .set({
        title: body.title,
        category: body.category,
        updatedAt: now,
        ...(publish
          ? {
              status: 'live' as const,
              publishedAt: now,
              expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            }
          : {}),
      })
      .where(eq(t.listings.id, id))
      .returning({ id: t.listings.id, slug: t.listings.slug, status: t.listings.status });
    return changed!;
  });
  return c.json(saved, 200);
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
  // Its poster, or anyone running the store it was posted as.
  const allowed =
    listing.ownerId === person.id ||
    (listing.storeId !== null && (await isMember(person.id, listing.storeId)));
  if (!allowed) return c.json({ error: 'That listing is not yours.' }, 403);
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
      // Changed by hand: no longer waiting on a store pass to come back.
      pausedByLapse: false,
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
