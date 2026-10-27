/**
 * Saved listings: the watchlist. Saving needs a sign in only, no phone.
 * Listings that have since sold or gone stay on the list, so the Saved page
 * can say so.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { ErrorSchema, ListingSchema } from '../schemas';
import { personFor } from './me';

export const savedRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const unauthorised = { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } };

const list = createRoute({
  method: 'get',
  path: '/me/saved',
  tags: ['Saved'],
  summary: 'Your saved listings',
  description: 'The ids, newest saved first, and the listings themselves, sold or gone ones included.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'Your saved listings',
      content: {
        'application/json': {
          schema: z.object({ ids: z.array(z.string()), listings: z.array(ListingSchema) }),
        },
      },
    },
    401: unauthorised,
  },
});

savedRoutes.openapi(list, async (c) => {
  const person = await personFor(c.get('authUser'));
  const rows = await db
    .select({ listingId: t.savedListings.listingId })
    .from(t.savedListings)
    .where(eq(t.savedListings.personId, person.id))
    .orderBy(desc(t.savedListings.savedAt));
  const ids = rows.map((row) => row.listingId);
  const listings = ids.length ? await loadListings(inArray(t.listings.id, ids), ids.length) : [];
  return c.json({ ids, listings }, 200);
});

const params = z.object({ listingId: z.string() });
const done = { description: 'Done', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } };

const save = createRoute({
  method: 'put',
  path: '/me/saved/{listingId}',
  tags: ['Saved'],
  summary: 'Save a listing',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params },
  responses: {
    200: done,
    401: unauthorised,
    404: { description: 'No such listing', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

savedRoutes.openapi(save, async (c) => {
  const { listingId } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  const [listing] = await db.select({ id: t.listings.id }).from(t.listings).where(eq(t.listings.id, listingId));
  if (!listing) return c.json({ error: 'That listing is not there any more.' }, 404);
  await db.insert(t.savedListings).values({ personId: person.id, listingId }).onConflictDoNothing();
  return c.json({ ok: true }, 200);
});

const unsave = createRoute({
  method: 'delete',
  path: '/me/saved/{listingId}',
  tags: ['Saved'],
  summary: 'Unsave a listing',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params },
  responses: { 200: done, 401: unauthorised },
});

savedRoutes.openapi(unsave, async (c) => {
  const { listingId } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  await db
    .delete(t.savedListings)
    .where(and(eq(t.savedListings.personId, person.id), eq(t.savedListings.listingId, listingId)));
  return c.json({ ok: true }, 200);
});
