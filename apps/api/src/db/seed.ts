/**
 * Fills the database with the app's mock data and the test accounts, so the
 * pages look the same on the API as they do today.
 *
 * Development only. It empties every table first, so run it again whenever
 * the data should go back to the start: `pnpm --filter @snt/api db:seed`.
 *
 * Offers and deal checks are seeded too (seedActivity); notifications are
 * left empty until their page moves to the API (backend plan, Phase 3).
 */

import '../loadEnv';
import { mockListings, mockStores, mockUsers } from '@snt/core';
import type { Item, Listing } from '@snt/core';
import { db, sql } from './client';
import * as t from './schema';
import { seedActivity } from './seedActivity';

/** Each test account signs in with its number and the fixed test code. */
const TEST_ACCOUNTS: Record<
  string,
  { phone: string; role?: 'moderator' | 'admin' | 'super_admin' }
> = {
  'u-tarisai': { phone: '+263770000001' },
  'u-avgames': { phone: '+263770000002' },
  'u-kopje': { phone: '+263770000003' },
  'u-kuda': { phone: '+263770000004' },
  'u-rumbi': { phone: '+263770000005', role: 'moderator' },
  'u-tafadzwa': { phone: '+263770000006', role: 'admin' },
  'u-hillary': { phone: '+263770000007', role: 'super_admin' },
};

/** People the mock data does not have: store staff and platform staff. */
const EXTRA_PEOPLE = [
  { id: 'u-kuda', displayName: 'Kuda S.', location: 'Harare CBD' },
  { id: 'u-rumbi', displayName: 'Rumbi M.', location: 'Harare' },
  { id: 'u-tafadzwa', displayName: 'Tafadzwa A.', location: 'Harare' },
  { id: 'u-hillary', displayName: 'Hillary M.', location: 'Harare' },
];

/**
 * In the mock data a store signs in as itself. Here a person owns it, so the
 * store accounts become their owners, with a person's name.
 */
const STORE_OWNER_NAMES: Record<string, string> = {
  'u-kopje': 'Tinashe K.',
  'u-samora': 'Samora C.',
  'u-msasa': 'Memory P.',
  'u-avgames': 'Takudzwa G.',
};

/** Stores with a month pass running. Avondale Games stays a free store. */
const PAID_STORES = ['s-kopje', 's-samora', 's-msasa'];

const day = 24 * 60 * 60 * 1000;
const at = (date: string | undefined) => (date ? new Date(date) : null);

async function seed() {
  const tables = [
    'appeals', 'moderation_actions', 'reports', 'boosts', 'payment_events',
    'notifications', 'deal_checks', 'offers', 'reveals', 'saved_listings',
    'auction_details', 'request_details', 'swap_details', 'sale_details',
    'listings', 'items', 'store_passes', 'payments', 'store_members',
    'stores', 'people',
  ];
  await sql.unsafe(`truncate ${tables.map((n) => `"${n}"`).join(', ')} cascade`);

  /* People */
  await db.insert(t.people).values([
    ...mockUsers.map((user) => ({
      id: user.id,
      phone: TEST_ACCOUNTS[user.id]?.phone ?? null,
      displayName: STORE_OWNER_NAMES[user.id] ?? user.displayName,
      role: TEST_ACCOUNTS[user.id]?.role ?? ('user' as const),
      standing: user.standing,
      location: user.location,
      phoneVerifiedAt: user.phoneVerified ? new Date(user.joinedAt) : null,
      joinedAt: new Date(user.joinedAt),
    })),
    ...EXTRA_PEOPLE.map((person) => ({
      ...person,
      phone: TEST_ACCOUNTS[person.id]!.phone,
      role: TEST_ACCOUNTS[person.id]!.role ?? ('user' as const),
      phoneVerifiedAt: new Date(),
    })),
  ]);

  /* Stores, their owners and staff, and passes */
  await db.insert(t.stores).values(
    mockStores.map((store) => ({
      id: store.id,
      slug: store.slug,
      name: store.name,
      initials: store.initials,
      description: store.description,
      location: store.location,
      openingHours: store.openingHours,
      verifiedAt: store.verified ? new Date(store.joinedAt) : null,
      createdAt: new Date(store.joinedAt),
    })),
  );

  await db.insert(t.storeMembers).values([
    ...mockUsers
      .filter((user) => user.storeId)
      .map((user) => ({
        storeId: user.storeId!,
        personId: user.id,
        role: 'owner' as const,
      })),
    { storeId: 's-kopje', personId: 'u-kuda', role: 'staff' as const },
  ]);

  const now = Date.now();
  await db.insert(t.storePasses).values(
    PAID_STORES.map((storeId) => ({
      storeId,
      kind: 'month' as const,
      startsAt: new Date(now - day),
      endsAt: new Date(now + 29 * day),
    })),
  );

  /* Listings, with their items and per type detail */
  const items: (typeof t.items.$inferInsert)[] = [];
  const addItem = (item: Item) => {
    if (!items.some((existing) => existing.id === item.id)) {
      items.push({
        id: item.id,
        category: item.category,
        name: item.name,
        brand: item.brand,
        model: item.model,
        condition: item.condition,
        defects: item.defects,
        accessories: item.accessories,
        specs: item.specs,
        images: item.images,
        wanted: item.wanted,
      });
    }
    return item.id;
  };

  const sales: (typeof t.saleDetails.$inferInsert)[] = [];
  const swaps: (typeof t.swapDetails.$inferInsert)[] = [];
  const requests: (typeof t.requestDetails.$inferInsert)[] = [];

  const rows = mockListings.map((listing: Listing) => {
    if (listing.type === 'sale') {
      sales.push({
        listingId: listing.id,
        itemId: addItem(listing.item),
        price: listing.price,
        previousPrice: listing.previousPrice,
        negotiable: listing.negotiable,
        stockCount: listing.stockCount,
        acceptsSwaps: listing.acceptsSwaps ?? false,
      });
    } else if (listing.type === 'swap') {
      swaps.push({
        listingId: listing.id,
        hasItemId: addItem(listing.has),
        wantsItemId: addItem(listing.wants),
        cashDirection: listing.cashDirection,
        cashAmount: listing.cashAmount,
        cashUpTo: listing.cashUpTo ?? false,
      });
    } else if (listing.type === 'request') {
      requests.push({
        listingId: listing.id,
        wantsItemId: addItem(listing.wants),
        budget: listing.budget,
      });
    }

    const created = new Date(listing.createdAt);
    return {
      id: listing.id,
      slug: listing.slug,
      type: listing.type,
      ownerId: listing.ownerId,
      storeId: listing.storeId,
      category: listing.category,
      title: listing.title,
      location: listing.location,
      status: listing.status,
      createdAt: created,
      updatedAt: created,
      publishedAt: listing.status === 'draft' ? null : created,
      expiresAt: at(listing.expiresAt),
      contactChannels: listing.contactChannels,
      contactSignedInOnly: listing.contactSignedInOnly ?? false,
      contactShownTo: listing.contactShownTo ?? 'everyone',
      contactToStores: listing.contactToStores ?? false,
      allowStoreOffers: listing.allowStoreOffers,
      viewCount: listing.viewCount,
      tags: listing.tags,
    };
  });

  await db.insert(t.items).values(items);
  await db.insert(t.listings).values(rows);
  if (sales.length) await db.insert(t.saleDetails).values(sales);
  if (swaps.length) await db.insert(t.swapDetails).values(swaps);
  if (requests.length) await db.insert(t.requestDetails).values(requests);

  console.log(
    `Seeded ${mockUsers.length + EXTRA_PEOPLE.length} people, ` +
      `${mockStores.length} stores, ${rows.length} listings, ${items.length} items.`,
  );
}

try {
  await seed();
  await seedActivity();
} finally {
  await sql.end();
}
