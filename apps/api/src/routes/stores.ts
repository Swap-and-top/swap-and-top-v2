/** A store's public page: who they are, their trust numbers, their stock. */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, eq, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { ErrorSchema, StoreSchema } from '../schemas';

export const storeRoutes = new OpenAPIHono();

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

storeRoutes.openapi(bySlug, async (c) => {
  const { slug } = c.req.valid('param');
  const [store] = await db
    .select()
    .from(t.stores)
    .where(and(eq(t.stores.slug, slug), isNull(t.stores.closedAt)));
  if (!store) return c.json({ error: 'Store not found' }, 404);

  const listings = await loadListings(
    and(eq(t.listings.storeId, store.id), eq(t.listings.status, 'live')),
  );

  // Deals both sides confirmed, on anything the store has listed.
  const [deals] = await db
    .select({ n: count() })
    .from(t.dealChecks)
    .innerJoin(t.listings, eq(t.listings.id, t.dealChecks.listingId))
    .where(and(eq(t.listings.storeId, store.id), eq(t.dealChecks.state, 'confirmed')));

  return c.json(
    {
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
      joinedAt: store.createdAt.toISOString().slice(0, 10),
      listings,
    },
    200,
  );
});

