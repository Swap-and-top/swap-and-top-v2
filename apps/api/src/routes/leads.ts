/**
 * Leads: people asking for what a store sells, seen from the Store console
 * (docs/features/wanted-and-leads.md). A lead is not a record of its own: it
 * is someone else's live Wanted or swap listing, in a category the store has
 * stock in, that lets stores make offers, matched against that stock by the
 * words in what they want. A match names the store's item; no match is still
 * a lead, since stores source to order.
 *
 * Number reveals are not here yet: Show contact does not record them.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, eq, inArray, isNull, ne, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { loadListings } from '../listings';
import { paidUntil } from '../passes';
import { ErrorSchema, ListingSchema } from '../schemas';
import { personFor } from './me';
import { isMember } from './post';

export const leadRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const LeadSchema = z
  .object({
    id: z.string(),
    demand: ListingSchema,
    requester: z.object({ id: z.string(), displayName: z.string(), confirmedDeals: z.number() }),
    /** The store's live item that answers it, when there is one. */
    matchedStockId: z.string().optional(),
    matchedStockLabel: z.string().optional(),
    /** Posted in the last day. */
    isNew: z.boolean(),
    /** "2h ago" */
    receivedAt: z.string(),
    area: z.string(),
    /** The store has an offer standing on it already. */
    offered: z.boolean(),
  })
  .openapi('Lead');

/** Words too common to say two things are alike. */
const COMMON = new Set(['the', 'and', 'for', 'with', 'any', 'or', 'better', 'newer', 'new', 'used', 'good', 'working']);

/** "RTX 3060 or Better" → ["rtx", "3060"]. */
function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2 && !COMMON.has(word));
}

/** Posted in the last day: "Just now", "12 minutes ago", "5h ago". */
const isRecent = (label: string) => /^(Just now|\d+ minutes? ago|\d+h ago)$/.test(label);

const leads = createRoute({
  method: 'get',
  path: '/stores/{id}/leads',
  tags: ['Stores'],
  summary: 'A store\'s leads',
  description:
    'Other people\'s live Wanted and swap listings in the categories the store has stock in, that let stores make offers, newest first, each matched against the store\'s live stock. Its owner and staff only, while a store pass covers now.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'The leads', content: { 'application/json': { schema: z.object({ leads: z.array(LeadSchema) }) } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    402: { description: 'No store pass covers now', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not the store\'s owner or staff', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

leadRoutes.openapi(leads, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  if (!(await isMember(person.id, id))) {
    return c.json({ error: 'Only the store\'s owner and staff can see its leads.' }, 403);
  }
  if (!(await paidUntil(id))) return c.json({ error: 'The Store console needs a store pass.', code: 'pass' }, 402);

  // What the store has live to sell: what it can answer with.
  const stock = await db
    .select({ id: t.listings.id, title: t.listings.title, category: t.listings.category })
    .from(t.listings)
    .where(and(eq(t.listings.storeId, id), eq(t.listings.status, 'live'), eq(t.listings.type, 'sale')));
  const categories = [...new Set(stock.map((item) => item.category))];
  if (categories.length === 0) return c.json({ leads: [] }, 200);

  const demand = await loadListings(
    and(
      eq(t.listings.status, 'live'),
      inArray(t.listings.type, ['request', 'swap']),
      inArray(t.listings.category, categories),
      eq(t.listings.allowStoreOffers, true),
      or(isNull(t.listings.storeId), ne(t.listings.storeId, id)),
    ),
    100,
  );

  const ownerIds = [...new Set(demand.map((listing) => listing.ownerId))];
  const people = ownerIds.length
    ? await db
        .select({ id: t.people.id, displayName: t.people.displayName })
        .from(t.people)
        .where(inArray(t.people.id, ownerIds))
    : [];
  // Deals both sides confirmed, as each person's trust number.
  const deals = ownerIds.length
    ? await db
        .select({ askerId: t.dealChecks.askerId, ownerId: t.dealChecks.ownerId })
        .from(t.dealChecks)
        .where(
          and(
            eq(t.dealChecks.state, 'confirmed'),
            or(inArray(t.dealChecks.askerId, ownerIds), inArray(t.dealChecks.ownerId, ownerIds)),
          ),
        )
    : [];
  const confirmed = (personId: string) =>
    deals.filter((deal) => deal.askerId === personId || deal.ownerId === personId).length;

  const standing = demand.length
    ? await db
        .select({ listingId: t.offers.listingId, n: count() })
        .from(t.offers)
        .where(
          and(
            eq(t.offers.fromStoreId, id),
            inArray(t.offers.state, ['pending', 'accepted']),
            inArray(
              t.offers.listingId,
              demand.map((listing) => listing.id),
            ),
          ),
        )
        .groupBy(t.offers.listingId)
    : [];
  const offered = new Set(standing.map((row) => row.listingId));

  const out = demand.flatMap((listing) => {
    if (listing.type !== 'request' && listing.type !== 'swap') return [];
    const wanted = wordsOf(listing.wants.name);
    // The store's item sharing most words with what they want, in its category.
    let best: { id: string; title: string; score: number } | undefined;
    for (const item of stock) {
      if (item.category !== listing.category) continue;
      const have = new Set(wordsOf(item.title));
      const score = wanted.filter((word) => have.has(word)).length;
      if (score > 0 && (!best || score > best.score)) best = { ...item, score };
    }
    const owner = people.find((p) => p.id === listing.ownerId);
    return [
      {
        id: listing.id,
        demand: listing,
        requester: {
          id: listing.ownerId,
          displayName: owner?.displayName || 'Someone',
          confirmedDeals: confirmed(listing.ownerId),
        },
        matchedStockId: best?.id,
        matchedStockLabel: best?.title,
        isNew: isRecent(listing.postedLabel),
        receivedAt: listing.postedLabel,
        area: listing.location,
        offered: offered.has(listing.id),
      },
    ];
  });
  return c.json({ leads: out }, 200);
});
