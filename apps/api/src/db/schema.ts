/**
 * The database, as Drizzle tables. See docs/architecture/backend-plan.md and
 * docs/architecture/data-model.md for why it is shaped this way.
 *
 * Three rules hold everywhere:
 * - Nothing is hard deleted. Things change state, so appeals, counts and
 *   history stay honest (decision A13).
 * - Every amount of money carries its currency (decision A14).
 * - Row level security is on for every table with no policies, so the
 *   public Supabase key reaches nothing. Only this API, signed in as the
 *   database owner, reads and writes.
 *
 * Enum values match the types in @snt/core, so rows map onto them directly.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { ItemSpecs } from '@snt/core';

const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const money = () => numeric({ precision: 12, scale: 2, mode: 'number' });
const currency = () => text().notNull().default('USD');

/* ── People and roles ─────────────────────────────────────────────────── */

/** What someone may do on the platform. Higher includes everything below. */
export const role = pgEnum('role', ['user', 'moderator', 'admin', 'super_admin']);

export const standing = pgEnum('standing', [
  'good',
  'warned',
  'limited',
  'suspended',
  'banned',
]);

/** Every account is a person. Stores hang off people through membership. */
export const people = pgTable(
  'people',
  {
    id: id(),
    /** The Supabase Auth user, linked at first sign in. */
    authUserId: uuid().unique(),
    /** The identity anchor, in international form: +263771234567. */
    phone: text().unique(),
    email: text(),
    /** First name and surname initial. Full names are never shown. */
    displayName: text().notNull(),
    role: role().notNull().default('user'),
    standing: standing().notNull().default('good'),
    suspendedUntil: timestamp({ withTimezone: true }),
    location: text(),
    phoneVerifiedAt: timestamp({ withTimezone: true }),
    joinedAt: createdAt(),
    lastSeenAt: timestamp({ withTimezone: true }),
  },
).enableRLS();

/* ── Stores ───────────────────────────────────────────────────────────── */

export const stores = pgTable('stores', {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  initials: text().notNull(),
  description: text().notNull().default(''),
  location: text().notNull(),
  openingHours: text().notNull().default(''),
  /** Set when staff have checked the business. Verified store badge. */
  verifiedAt: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
  /** Closed by its owner. Its listings close with it. */
  closedAt: timestamp({ withTimezone: true }),
}).enableRLS();

export const storeMemberRole = pgEnum('store_member_role', ['owner', 'staff']);

/** Who runs a store: one owner, any number of staff, each a person. */
export const storeMembers = pgTable(
  'store_members',
  {
    storeId: text()
      .notNull()
      .references(() => stores.id),
    personId: text()
      .notNull()
      .references(() => people.id),
    role: storeMemberRole().notNull(),
    addedAt: createdAt(),
    removedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.storeId, t.personId] }),
    index().on(t.personId),
  ],
).enableRLS();

export const passKind = pgEnum('pass_kind', ['day', 'week', 'month']);

/**
 * A prepaid store pass. A store is paid exactly while a pass covers now;
 * there is no stored "paid" flag to go stale.
 */
export const storePasses = pgTable(
  'store_passes',
  {
    id: id(),
    storeId: text()
      .notNull()
      .references(() => stores.id),
    kind: passKind().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    paymentId: text().references(() => payments.id),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.storeId, t.endsAt)],
).enableRLS();

/* ── Items and listings ───────────────────────────────────────────────── */

export const category = pgEnum('category', [
  'phones',
  'laptops',
  'desktops',
  'consoles',
  'parts',
  'accessories',
  'other',
]);

export const condition = pgEnum('condition', [
  'boxed-new',
  'like-new',
  'good',
  'fair',
]);

/** A described device. A swap refers to two of them. */
export const items = pgTable('items', {
  id: id(),
  category: category().notNull(),
  name: text().notNull(),
  brand: text(),
  model: text(),
  condition: condition(),
  defects: text(),
  accessories: text(),
  specs: jsonb().$type<ItemSpecs>().notNull().default({}),
  /** Photo addresses, in order. Empty for something wanted. */
  images: text().array().notNull().default(sql`'{}'`),
  wanted: boolean().notNull().default(false),
}).enableRLS();

export const listingType = pgEnum('listing_type', [
  'sale',
  'swap',
  'request',
  'auction',
]);

export const listingStatus = pgEnum('listing_status', [
  'draft',
  'live',
  'paused',
  'sold',
  'expired',
  'withdrawn',
  'removed',
]);

export const contactShownTo = pgEnum('contact_shown_to', ['everyone', 'offers']);

export const promotionSlot = pgEnum('promotion_slot', [
  'organic',
  'sponsored',
  'drop',
]);

/** What every listing carries, whatever its type. */
export const listings = pgTable(
  'listings',
  {
    id: id(),
    /** Readable, and never changed once published. */
    slug: text().notNull().unique(),
    type: listingType().notNull(),
    ownerId: text()
      .notNull()
      .references(() => people.id),
    /** Set when posted as a store. */
    storeId: text().references(() => stores.id),
    category: category().notNull(),
    title: text().notNull(),
    location: text().notNull(),
    status: listingStatus().notNull().default('draft'),
    createdAt: createdAt(),
    updatedAt: createdAt(),
    publishedAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
    soldAt: timestamp({ withTimezone: true }),
    contactChannels: text().array().notNull().default(sql`'{}'`),
    contactSignedInOnly: boolean().notNull().default(false),
    contactShownTo: contactShownTo().notNull().default('everyone'),
    contactToStores: boolean().notNull().default(false),
    allowStoreOffers: boolean().notNull().default(true),
    viewCount: integer().notNull().default(0),
    tags: text().array().notNull().default(sql`'{}'`),
  },
  (t) => [
    index().on(t.status, t.type, t.category),
    index().on(t.ownerId),
    index().on(t.storeId),
  ],
).enableRLS();

/** A sale: one item and its price. */
export const saleDetails = pgTable('sale_details', {
  listingId: text()
    .primaryKey()
    .references(() => listings.id),
  itemId: text()
    .notNull()
    .references(() => items.id),
  price: money().notNull(),
  previousPrice: money(),
  currency: currency(),
  negotiable: boolean().notNull().default(true),
  /** How many of this model a store holds. */
  stockCount: integer(),
  acceptsSwaps: boolean().notNull().default(false),
}).enableRLS();

export const cashDirection = pgEnum('cash_direction', [
  'i-add',
  'they-add',
  'straight',
]);

/** A swap: what the poster has, what they want, and the cash either way. */
export const swapDetails = pgTable('swap_details', {
  listingId: text()
    .primaryKey()
    .references(() => listings.id),
  hasItemId: text()
    .notNull()
    .references(() => items.id),
  wantsItemId: text()
    .notNull()
    .references(() => items.id),
  cashDirection: cashDirection().notNull(),
  cashAmount: money(),
  currency: currency(),
  /** "I add up to": the cash is a ceiling. */
  cashUpTo: boolean().notNull().default(false),
}).enableRLS();

/** A Wanted listing: what they want and what they will pay. */
export const requestDetails = pgTable('request_details', {
  listingId: text()
    .primaryKey()
    .references(() => listings.id),
  wantsItemId: text()
    .notNull()
    .references(() => items.id),
  budget: money().notNull(),
  currency: currency(),
}).enableRLS();

/** Defined so the shape can hold auctions later. Not built (decision A12). */
export const auctionDetails = pgTable('auction_details', {
  listingId: text()
    .primaryKey()
    .references(() => listings.id),
  itemId: text()
    .notNull()
    .references(() => items.id),
  startingPrice: money().notNull(),
  reservePrice: money(),
  currency: currency(),
  closesAt: timestamp({ withTimezone: true }).notNull(),
  extensionCount: integer().notNull().default(0),
}).enableRLS();

export const savedListings = pgTable(
  'saved_listings',
  {
    personId: text()
      .notNull()
      .references(() => people.id),
    listingId: text()
      .notNull()
      .references(() => listings.id),
    savedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.listingId] })],
).enableRLS();

/* ── Contact, offers and deals ────────────────────────────────────────── */

/** Someone tapped Show contact. A record, not a counter. */
export const reveals = pgTable(
  'reveals',
  {
    id: id(),
    listingId: text()
      .notNull()
      .references(() => listings.id),
    /** Only when signed in. */
    viewerId: text().references(() => people.id),
    /** For rate limits only. Never an identity. */
    deviceHash: text().notNull(),
    slot: promotionSlot().notNull().default('organic'),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.listingId), index().on(t.deviceHash, t.createdAt)],
).enableRLS();

export const offerState = pgEnum('offer_state', [
  'pending',
  'accepted',
  'declined',
  'withdrawn',
]);

export const offerCashFrom = pgEnum('offer_cash_from', [
  'owner',
  'offerer',
  'none',
]);

export const offers = pgTable(
  'offers',
  {
    id: id(),
    listingId: text()
      .notNull()
      .references(() => listings.id),
    fromPersonId: text()
      .notNull()
      .references(() => people.id),
    /** Set when sent as a store. */
    fromStoreId: text().references(() => stores.id),
    /** What is put forward, when it is one of their own listings. */
    itemListingId: text().references(() => listings.id),
    itemName: text(),
    itemCondition: condition(),
    cashAmount: money().notNull().default(0),
    currency: currency(),
    cashFrom: offerCashFrom().notNull(),
    message: text(),
    /** The ways they can be reached, shown once accepted. */
    reachOn: text().array().notNull().default(sql`'{}'`),
    state: offerState().notNull().default('pending'),
    createdAt: createdAt(),
    answeredAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.listingId), index().on(t.fromPersonId)],
).enableRLS();

export const dealSource = pgEnum('deal_source', ['offer', 'reveal']);
export const dealAnswer = pgEnum('deal_answer', ['yes', 'no', 'not-yet']);
export const dealState = pgEnum('deal_state', [
  'pending',
  'confirmed',
  'closed',
  'lapsed',
]);

/** "Did you make the deal?" Counted only when both say yes. */
export const dealChecks = pgTable(
  'deal_checks',
  {
    id: id(),
    source: dealSource().notNull(),
    offerId: text().references(() => offers.id),
    revealId: text().references(() => reveals.id),
    listingId: text()
      .notNull()
      .references(() => listings.id),
    askerId: text()
      .notNull()
      .references(() => people.id),
    ownerId: text()
      .notNull()
      .references(() => people.id),
    askerAnswer: dealAnswer(),
    askerAnsweredAt: timestamp({ withTimezone: true }),
    ownerAnswer: dealAnswer(),
    ownerAnsweredAt: timestamp({ withTimezone: true }),
    state: dealState().notNull().default('pending'),
    promptedAt: timestamp({ withTimezone: true }),
    deferredAt: timestamp({ withTimezone: true }),
    resolvedAt: timestamp({ withTimezone: true }),
    lapsesAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex().on(t.listingId, t.askerId, t.ownerId),
    index().on(t.askerId),
    index().on(t.ownerId),
  ],
).enableRLS();

/* ── Notifications ────────────────────────────────────────────────────── */

export const notificationKind = pgEnum('notification_kind', [
  'offer',
  'offer-reply',
  'deal',
  'lead',
  'reveal',
  'listing',
  'saved',
  'sponsor',
  'account',
  'report',
]);

/** One line on a person's list, or on a store's list when storeId is set. */
export const notifications = pgTable(
  'notifications',
  {
    id: id(),
    personId: text().references(() => people.id),
    storeId: text().references(() => stores.id),
    kind: notificationKind().notNull(),
    text: text().notNull(),
    href: text().notNull(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index().on(t.personId, t.createdAt),
    index().on(t.storeId, t.createdAt),
    check(
      'notification_has_audience',
      sql`${t.personId} is not null or ${t.storeId} is not null`,
    ),
  ],
).enableRLS();

/* ── Payments and boosts ──────────────────────────────────────────────── */

export const paymentPurpose = pgEnum('payment_purpose', ['store_pass', 'boost']);
export const paymentStatus = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'cancelled',
]);

/** A payment through Paynow, for a store pass or a boost. */
export const payments = pgTable(
  'payments',
  {
    id: id(),
    personId: text()
      .notNull()
      .references(() => people.id),
    storeId: text().references(() => stores.id),
    purpose: paymentPurpose().notNull(),
    amount: money().notNull(),
    currency: currency(),
    provider: text().notNull().default('paynow'),
    /** Paynow's reference, so a repeated callback is recognised. */
    providerRef: text().unique(),
    status: paymentStatus().notNull().default('pending'),
    createdAt: createdAt(),
    paidAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.personId)],
).enableRLS();

/** Every callback from Paynow, kept as it came. Append only (decision A15). */
export const paymentEvents = pgTable('payment_events', {
  id: id(),
  paymentId: text().references(() => payments.id),
  body: jsonb().notNull(),
  receivedAt: createdAt(),
}).enableRLS();

/** A boost on one listing: a daily budget for a set number of days. */
export const boosts = pgTable(
  'boosts',
  {
    id: id(),
    listingId: text()
      .notNull()
      .references(() => listings.id),
    boughtById: text()
      .notNull()
      .references(() => people.id),
    dailyBudget: money().notNull(),
    currency: currency(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    stoppedAt: timestamp({ withTimezone: true }),
    paymentId: text().references(() => payments.id),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.listingId, t.endsAt)],
).enableRLS();

/* ── Reports, actions and appeals ─────────────────────────────────────── */

export const reportReason = pgEnum('report_reason', [
  'stolen',
  'not-as-described',
  'fake',
  'duplicate',
  'offensive',
  'wrong-category',
  'no-show',
  'other',
]);

/** Open, then claimed by one moderator, then approved or cleared. */
export const reportState = pgEnum('report_state', [
  'open',
  'claimed',
  'approved',
  'cleared',
]);

/** A report on a listing or on a person. Never deleted, even when cleared. */
export const reports = pgTable(
  'reports',
  {
    id: id(),
    /** Shown to staff as REP 2026 0001. */
    number: integer().generatedAlwaysAsIdentity(),
    reporterId: text()
      .notNull()
      .references(() => people.id),
    listingId: text().references(() => listings.id),
    /** The person reported, or the listing's owner when it is a listing. */
    personId: text()
      .notNull()
      .references(() => people.id),
    reason: reportReason().notNull(),
    details: text(),
    state: reportState().notNull().default('open'),
    claimedById: text().references(() => people.id),
    claimedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    closedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index().on(t.state, t.createdAt),
    index().on(t.personId),
    index().on(t.listingId),
  ],
).enableRLS();

export const actionKind = pgEnum('action_kind', [
  'none',
  'warning',
  'removal',
  'suspension',
  'ban',
]);

/** What staff decided, by whom and why. Reversed, never deleted. */
export const moderationActions = pgTable(
  'moderation_actions',
  {
    id: id(),
    reportId: text().references(() => reports.id),
    personId: text()
      .notNull()
      .references(() => people.id),
    listingId: text().references(() => listings.id),
    decidedById: text()
      .notNull()
      .references(() => people.id),
    kind: actionKind().notNull(),
    /** The reason it was decided under, changed from the report's if wrong. */
    reason: reportReason().notNull(),
    note: text(),
    /** For a suspension. */
    until: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    reversedAt: timestamp({ withTimezone: true }),
    reversedById: text().references(() => people.id),
  },
  (t) => [index().on(t.personId), index().on(t.reportId)],
).enableRLS();

export const appealOutcome = pgEnum('appeal_outcome', ['upheld', 'overturned']);

/** One appeal per action, reviewed by an admin other than the one who decided. */
export const appeals = pgTable('appeals', {
  id: id(),
  actionId: text()
    .notNull()
    .unique()
    .references(() => moderationActions.id),
  personId: text()
    .notNull()
    .references(() => people.id),
  statement: text().notNull(),
  reviewedById: text().references(() => people.id),
  outcome: appealOutcome(),
  reason: text(),
  createdAt: createdAt(),
  reviewedAt: timestamp({ withTimezone: true }),
}).enableRLS();
