/**
 * What the API sends back, as Zod schemas. The same schemas check the
 * responses and write the OpenAPI contract that the Swagger page at /docs
 * shows. Shapes follow the types in @snt/core, so the web app can move from
 * mock data to the API without changing its components.
 */

import { z } from '@hono/zod-openapi';

const category = z
  .enum(['phones', 'laptops', 'desktops', 'consoles', 'parts', 'accessories', 'other'])
  .openapi({ example: 'laptops' });

const condition = z.enum(['boxed-new', 'like-new', 'good', 'fair']);

export const ItemSchema = z
  .object({
    id: z.string(),
    category,
    name: z.string().openapi({ example: 'ThinkPad T480' }),
    brand: z.string().optional(),
    model: z.string().optional(),
    condition: condition.optional(),
    defects: z.string().optional(),
    accessories: z.string().optional(),
    specs: z.record(z.string(), z.string()),
    images: z.array(z.string()),
    wanted: z.boolean(),
  })
  .openapi('Item');

const base = {
  id: z.string(),
  slug: z.string().openapi({ example: 'thinkpad-t480-i5-8gb-256gb' }),
  ownerId: z.string(),
  storeId: z.string().optional(),
  category,
  title: z.string(),
  location: z.string(),
  status: z.enum(['draft', 'live', 'paused', 'sold', 'expired', 'withdrawn', 'removed']),
  createdAt: z.string().openapi({ example: '2026-09-24' }),
  expiresAt: z.string(),
  contactChannels: z.array(z.string()),
  contactSignedInOnly: z.boolean(),
  contactShownTo: z.enum(['everyone', 'offers']),
  contactToStores: z.boolean(),
  allowStoreOffers: z.boolean(),
  viewCount: z.number().int(),
  /** Counted from the reveal records. */
  revealCount: z.number().int(),
  /** Sponsored while a boost runs. */
  promotion: z.enum(['organic', 'sponsored', 'drop']),
  tags: z.array(z.string()),
};

export const SaleListingSchema = z
  .object({
    ...base,
    type: z.literal('sale'),
    item: ItemSchema,
    price: z.number(),
    negotiable: z.boolean(),
    stockCount: z.number().int().optional(),
    previousPrice: z.number().optional(),
    acceptsSwaps: z.boolean(),
  })
  .openapi('SaleListing');

export const SwapListingSchema = z
  .object({
    ...base,
    type: z.literal('swap'),
    has: ItemSchema,
    wants: ItemSchema,
    cashDirection: z.enum(['i-add', 'they-add', 'straight']),
    cashAmount: z.number().optional(),
    cashUpTo: z.boolean(),
    offerCount: z.number().int(),
  })
  .openapi('SwapListing');

export const RequestListingSchema = z
  .object({
    ...base,
    type: z.literal('request'),
    wants: ItemSchema,
    budget: z.number(),
    responseCount: z.number().int(),
  })
  .openapi('WantedListing');

export const ListingSchema = z
  .discriminatedUnion('type', [SaleListingSchema, SwapListingSchema, RequestListingSchema])
  .openapi('Listing');

export const ListingPageSchema = z
  .object({
    listings: z.array(ListingSchema),
    /** Pass back as `cursor` for the next page. Missing on the last page. */
    nextCursor: z.string().optional(),
  })
  .openapi('ListingPage');

export const StoreSchema = z
  .object({
    id: z.string(),
    slug: z.string().openapi({ example: 'kopje-computers' }),
    name: z.string(),
    initials: z.string(),
    description: z.string(),
    location: z.string(),
    openingHours: z.string(),
    verified: z.boolean(),
    /** Live listings for sale or swap. */
    stockCount: z.number().int(),
    confirmedDeals: z.number().int(),
    joinedAt: z.string(),
    listings: z.array(ListingSchema),
  })
  .openapi('Store');

export const ErrorSchema = z
  .object({ error: z.string().openapi({ example: 'Listing not found' }) })
  .openapi('Error');

export const MeSchema = z
  .object({
    id: z.string().openapi({ example: 'u-tarisai' }),
    /** Empty for a new person until they give their name. */
    displayName: z.string().openapi({ example: 'Tarisai M.' }),
    phone: z.string().optional().openapi({ example: '+263770000001' }),
    /** Needed to post, make offers and reach other people. */
    phoneVerified: z.boolean(),
    role: z.enum(['user', 'moderator', 'admin', 'super_admin']),
    standing: z.enum(['good', 'warned', 'limited', 'suspended', 'banned']),
    /** The stores they own or work for. */
    stores: z.array(
      z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        role: z.enum(['owner', 'staff']),
      }),
    ),
  })
  .openapi('Me');
