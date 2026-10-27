/**
 * Reading listings from the database into the shapes in schemas.ts: the
 * shared row, its sale, swap or Wanted detail, its items, and the counts that
 * come from other records (reveals, offers, boosts).
 */

import { and, count, desc, eq, gt, inArray, isNull, lte, notInArray, type SQL } from 'drizzle-orm';
import type { z } from '@hono/zod-openapi';
import { db } from './db/client';
import * as t from './db/schema';
import type { ItemSchema, ListingSchema } from './schemas';

type ListingOut = z.infer<typeof ListingSchema>;
type ItemOut = z.infer<typeof ItemSchema>;

/** Nulls from the database become missing fields, as in @snt/core. */
const opt = <T>(value: T | null): T | undefined => value ?? undefined;
const dateOnly = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : '');

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

  const [sales, swaps, requests, reveals, offers, boosts] = await Promise.all([
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
      .where(inArray(t.offers.listingId, ids))
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
  ]);

  const itemIds = [
    ...sales.map((s) => s.itemId),
    ...swaps.flatMap((s) => [s.hasItemId, s.wantsItemId]),
    ...requests.map((r) => r.wantsItemId),
  ];
  const items = new Map(
    (itemIds.length
      ? await db.select().from(t.items).where(inArray(t.items.id, itemIds))
      : []
    ).map((item) => [item.id, item]),
  );

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
export function liveListings(): Promise<ListingOut[]> {
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
