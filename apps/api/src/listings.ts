/**
 * Reading listings from the database into the shapes in schemas.ts: the
 * shared row, its sale, swap or Wanted detail, its items, and the counts that
 * come from other records (reveals, offers, boosts).
 */

import { and, count, desc, eq, gt, inArray, isNull, lte, ne, notInArray, or, type SQL } from 'drizzle-orm';
import type { z } from '@hono/zod-openapi';
import { db } from './db/client';
import * as t from './db/schema';
import { settlePasses } from './passes';
import type { ItemSchema, ListingSchema } from './schemas';

type ListingOut = z.infer<typeof ListingSchema>;
type ItemOut = z.infer<typeof ItemSchema>;

/** Nulls from the database become missing fields, as in @snt/core. */
const opt = <T>(value: T | null): T | undefined => value ?? undefined;
const dateOnly = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : '');

/** "Just now", "12 minutes ago", "2h ago", "Yesterday", "4 days ago",
    "3 weeks ago": when it went up. Worked out here, as it is loaded, so the
    page and the browser show the same words. */
function postedLabel(at: Date): string {
  const minutes = Math.floor((Date.now() - at.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

/**
 * Listings anyone may see: the owner is not suspended or banned, and the
 * store it was posted as is not closed. Applied in the query, so such
 * listings can never reach the feed (docs/features/moderation.md).
 */
export const visibleOwner = and(
  notInArray(t.people.standing, ['suspended', 'banned']),
  isNull(t.stores.closedAt),
);

/** Listings matching `where`, newest first, in the API's shape. */
export async function loadListings(where: SQL | undefined, limit = 100): Promise<ListingOut[]> {
  const rows = await db
    .select({ listing: t.listings })
    .from(t.listings)
    .innerJoin(t.people, eq(t.people.id, t.listings.ownerId))
    .leftJoin(t.stores, eq(t.stores.id, t.listings.storeId))
    .where(and(visibleOwner, where))
    .orderBy(desc(t.listings.publishedAt), desc(t.listings.id))
    .limit(limit);
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.listing.id);
  const now = new Date();

  // Everything else in one batch, the items too, found through the details
  // rather than after them: each trip to the database is slow from afar.
  const [sales, swaps, requests, reveals, offers, boosts, itemRows] = await Promise.all([
    db.select().from(t.saleDetails).where(inArray(t.saleDetails.listingId, ids)),
    db.select().from(t.swapDetails).where(inArray(t.swapDetails.listingId, ids)),
    db.select().from(t.requestDetails).where(inArray(t.requestDetails.listingId, ids)),
    db
      .select({ listingId: t.reveals.listingId, n: count() })
      .from(t.reveals)
      .where(inArray(t.reveals.listingId, ids))
      .groupBy(t.reveals.listingId),
    db
      .select({ listingId: t.offers.listingId, n: count() })
      .from(t.offers)
      // Withdrawn offers are as if never made.
      .where(and(inArray(t.offers.listingId, ids), ne(t.offers.state, 'withdrawn')))
      .groupBy(t.offers.listingId),
    db
      .select({ listingId: t.boosts.listingId })
      .from(t.boosts)
      .where(
        and(
          inArray(t.boosts.listingId, ids),
          lte(t.boosts.startsAt, now),
          gt(t.boosts.endsAt, now),
          isNull(t.boosts.stoppedAt),
        ),
      ),
    db
      .select()
      .from(t.items)
      .where(
        or(
          inArray(
            t.items.id,
            db.select({ id: t.saleDetails.itemId }).from(t.saleDetails).where(inArray(t.saleDetails.listingId, ids)),
          ),
          inArray(
            t.items.id,
            db.select({ id: t.swapDetails.hasItemId }).from(t.swapDetails).where(inArray(t.swapDetails.listingId, ids)),
          ),
          inArray(
            t.items.id,
            db.select({ id: t.swapDetails.wantsItemId }).from(t.swapDetails).where(inArray(t.swapDetails.listingId, ids)),
          ),
          inArray(
            t.items.id,
            db
              .select({ id: t.requestDetails.wantsItemId })
              .from(t.requestDetails)
              .where(inArray(t.requestDetails.listingId, ids)),
          ),
        ),
      ),
  ]);

  const items = new Map(itemRows.map((item) => [item.id, item]));

  const itemOut = (id: string): ItemOut => {
    const item = items.get(id)!;
    return {
      id: item.id,
      category: item.category,
      name: item.name,
      brand: opt(item.brand),
      model: opt(item.model),
      condition: opt(item.condition),
      defects: opt(item.defects),
      accessories: opt(item.accessories),
      specs: item.specs as Record<string, string>,
      images: item.images,
      wanted: item.wanted,
    };
  };
  const revealCount = new Map(reveals.map((r) => [r.listingId, r.n]));
  const offerCount = new Map(offers.map((o) => [o.listingId, o.n]));
  const boosted = new Set(boosts.map((b) => b.listingId));

  return rows.flatMap(({ listing }): ListingOut[] => {
    const shared = {
      id: listing.id,
      slug: listing.slug,
      ownerId: listing.ownerId,
      storeId: opt(listing.storeId),
      category: listing.category,
      title: listing.title,
      location: listing.location,
      status: listing.status,
      createdAt: dateOnly(listing.createdAt),
      expiresAt: dateOnly(listing.expiresAt),
      postedLabel: postedLabel(listing.publishedAt ?? listing.createdAt),
      contactChannels: listing.contactChannels,
      contactSignedInOnly: listing.contactSignedInOnly,
      contactShownTo: listing.contactShownTo,
      contactToStores: listing.contactToStores,
      allowStoreOffers: listing.allowStoreOffers,
      viewCount: listing.viewCount,
      revealCount: revealCount.get(listing.id) ?? 0,
      promotion: boosted.has(listing.id) ? ('sponsored' as const) : ('organic' as const),
      tags: listing.tags,
    };

    if (listing.type === 'sale') {
      const sale = sales.find((s) => s.listingId === listing.id);
      if (!sale) return [];
      return [
        {
          ...shared,
          type: 'sale',
          item: itemOut(sale.itemId),
          price: sale.price,
          negotiable: sale.negotiable,
          stockCount: opt(sale.stockCount),
          previousPrice: opt(sale.previousPrice),
          acceptsSwaps: sale.acceptsSwaps,
        },
      ];
    }
    if (listing.type === 'swap') {
      const swap = swaps.find((s) => s.listingId === listing.id);
      if (!swap) return [];
      return [
        {
          ...shared,
          type: 'swap',
          has: itemOut(swap.hasItemId),
          wants: itemOut(swap.wantsItemId),
          cashDirection: swap.cashDirection,
          cashAmount: opt(swap.cashAmount),
          cashUpTo: swap.cashUpTo,
          offerCount: offerCount.get(listing.id) ?? 0,
        },
      ];
    }
    if (listing.type === 'request') {
      const request = requests.find((r) => r.listingId === listing.id);
      if (!request) return [];
      return [
        {
          ...shared,
          type: 'request',
          wants: itemOut(request.wantsItemId),
          budget: request.budget,
          responseCount: offerCount.get(listing.id) ?? 0,
        },
      ];
    }
    // Auctions are defined but not built.
    return [];
  });
}

/** Every live listing, newest first: the feed, built on the server. */
export async function liveListings(): Promise<ListingOut[]> {
  // Ended store passes pause what a free store may not keep live first.
  await settlePasses();
  return loadListings(eq(t.listings.status, 'live'), 500);
}

/** One listing by its slug, unless it is a draft or was removed. */
export async function listingBySlug(slug: string): Promise<ListingOut | undefined> {
  const [listing] = await loadListings(
    and(eq(t.listings.slug, slug), notInArray(t.listings.status, ['draft', 'removed'])),
    1,
  );
  return listing;
}
