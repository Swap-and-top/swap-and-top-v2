/** Browse listings and read one. Both public, and never with contact details. */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, eq, ilike, lt, notInArray, or, type SQL } from 'drizzle-orm';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { ErrorSchema, ListingPageSchema, ListingSchema } from '../schemas';

export const listingRoutes = new OpenAPIHono();

const browse = createRoute({
  method: 'get',
  path: '/listings',
  tags: ['Listings'],
  summary: 'Browse listings',
  description:
    'The feed: live listings only, newest first, from accounts in good standing. Never includes contact details.',
  request: {
    query: z.object({
      type: z.enum(['sale', 'swap', 'request']).optional().openapi({
        description: 'sale, swap, or request (a Wanted listing)',
      }),
      category: z
        .enum(['phones', 'laptops', 'desktops', 'consoles', 'parts', 'accessories', 'other'])
        .optional(),
      location: z.string().optional().openapi({ description: 'Part of an area name, e.g. Avondale' }),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      cursor: z.string().optional().openapi({
        description: 'The nextCursor from the page before',
      }),
    }),
  },
  responses: {
    200: {
      description: 'A page of listings',
      content: { 'application/json': { schema: ListingPageSchema } },
    },
  },
});

/** The cursor is the last listing's published time and id, opaque to clients. */
const encodeCursor = (publishedAt: string, id: string) =>
  Buffer.from(`${publishedAt}|${id}`).toString('base64url');
const decodeCursor = (cursor: string) => {
  const [time, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  return time && id ? { time: new Date(time), id } : null;
};

listingRoutes.openapi(browse, async (c) => {
  const { type, category, location, limit, cursor } = c.req.valid('query');
  const after = cursor ? decodeCursor(cursor) : null;

  const where: (SQL | undefined)[] = [
    eq(t.listings.status, 'live'),
    type ? eq(t.listings.type, type) : notInArray(t.listings.type, ['auction']),
    category ? eq(t.listings.category, category) : undefined,
    location ? ilike(t.listings.location, `%${location}%`) : undefined,
    after
      ? or(
          lt(t.listings.publishedAt, after.time),
          and(eq(t.listings.publishedAt, after.time), lt(t.listings.id, after.id)),
        )
      : undefined,
  ];

  // One more than asked, to know whether there is a next page.
  const found = await loadListings(and(...where), limit + 1);
  const listings = found.slice(0, limit);
  const last = listings.at(-1);
  const publishedAt = last ? await publishedTime(last.id) : undefined;

  return c.json(
    {
      listings,
      nextCursor: found.length > limit && last && publishedAt ? encodeCursor(publishedAt, last.id) : undefined,
    },
    200,
  );
});

async function publishedTime(id: string) {
  const [row] = await db
    .select({ at: t.listings.publishedAt })
    .from(t.listings)
    .where(eq(t.listings.id, id));
  return row?.at?.toISOString();
}

const bySlug = createRoute({
  method: 'get',
  path: '/listings/{slug}',
  tags: ['Listings'],
  summary: 'Get a listing',
  description: 'One listing by its address. Drafts and removed listings are not found.',
  request: {
    params: z.object({
      slug: z.string().openapi({ example: 'thinkpad-t480-i5-8gb-256gb' }),
    }),
  },
  responses: {
    200: {
      description: 'The listing',
      content: { 'application/json': { schema: ListingSchema } },
    },
    404: {
      description: 'No such listing',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

listingRoutes.openapi(bySlug, async (c) => {
  const { slug } = c.req.valid('param');
  const [listing] = await loadListings(
    and(eq(t.listings.slug, slug), notInArray(t.listings.status, ['draft', 'removed'])),
    1,
  );
  if (!listing) return c.json({ error: 'Listing not found' }, 404);
  return c.json(listing, 200);
});
