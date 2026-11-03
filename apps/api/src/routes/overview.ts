/**
 * The Overview, every team member's first page in the Staff console
 * (docs/product/staff-console.md): the numbers their departments need, a
 * week, a month or a year at a time against the one before. Look only, and
 * no personal data: counts and sums, never a name or a number.
 *
 * It is made of sections, one for each part of the business, and a
 * person gets the sections of the departments they are in (the super
 * admin, all of them). First comes My overview, the cards they chose
 * themselves from those sections, in their order
 * (`PUT /staff/overview/cards`, kept in `staff_overview_cards`):
 *
 * - The business (Executives and the Board): new users, new listings,
 *   offers, confirmed deals, value swapped, revenue; and for Executives
 *   only what stands today (the Board is outside the company).
 * - Trust and safety: reports received, handled and handled by you,
 *   actions taken, open reports, those open over two days, users
 *   suspended or banned; leaders also appeals waiting and decided, and
 *   stores waiting to be verified.
 * - Sales: new stores, store passes sold, stores to call (as the Stores
 *   tab counts them), passes ending soon or lapsed, paying stores.
 * - Finance: revenue, payments made and failed, store passes and boosts
 *   sold.
 * - Marketing: new users, active users, listing views, number reveals.
 * - DevOps: nothing recorded yet (health comes with Phase 7); it says so.
 *
 * Each section is a tab on the page, one on show at a time, so each is
 * whole: a tile two departments share (revenue, say) is in both.
 *
 * Two kinds of tile. What happened in the period comes with the period
 * before and a chart. What stands now has no history to compare, so it is
 * today's figure alone.
 *
 * By the business definitions (2026-10-30): an active user used the app in
 * the last 30 days; value swapped is the money in deals both sides
 * confirmed (the cash in the offer, else the listing's price, $0 for a
 * straight swap); revenue and every payment count are paid payments, never
 * test ones, and a tile says how many test ones it left out. Periods run
 * in Harare's time, as on Revenue (revenue.ts).
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, ne, sql, type Column } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { staffOf } from '../staff';
import type { Department } from '@snt/core';
import { personFor } from './me';
import { bounds, bucketOf, bucketsOf, keyOf, labelOf, previousKey } from './revenue';
import { storeRows, toCall } from './sales';

export const overviewRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const UNITS = ['week', 'month', 'year'] as const;
type Unit = (typeof UNITS)[number];
const DAY = 24 * 60 * 60_000;

/** One thing that happened, when, how much it adds (1, or money), and
    whether it is a test payment, which never counts. */
interface Event {
  at: Date;
  amount: number;
  test?: boolean;
}

const TileSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    /** `period`: what happened, with the one before and a chart; `now`:
        what stands today. */
    kind: z.enum(['period', 'now']),
    money: z.boolean(),
    current: z.number(),
    previous: z.number().optional(),
    chart: z.object({ current: z.array(z.number()), previous: z.array(z.number()) }).optional(),
    /** A line under the figure: what a "now" figure means, or how much
        test money was left out. */
    note: z.string().optional(),
  })
  .openapi('OverviewTile');
type Tile = z.infer<typeof TileSchema>;

const SectionSchema = z
  .object({
    key: z.enum(['mine', 'business', 'trust', 'sales', 'finance', 'marketing', 'devops']),
    title: z.string(),
    tiles: z.array(TileSchema),
    /** Said when there is nothing to show yet. */
    note: z.string().optional(),
  })
  .openapi('OverviewSection');
type Section = z.infer<typeof SectionSchema>;

const read = createRoute({
  method: 'get',
  path: '/staff/overview',
  tags: ['Staff'],
  summary: 'The numbers each team member needs',
  description:
    'Anyone on the team: the sections of their departments (the super admin, all), each whole, for a week, month or year (the current one, unless `period` is given) beside the one before. Counts and sums only; test payments never count.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    query: z.object({
      unit: z.enum(UNITS).default('month'),
      period: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Their sections',
      content: {
        'application/json': {
          schema: z.object({
            unit: z.enum(UNITS),
            period: z.string(),
            /** The ones to choose from, newest first. */
            periods: z.array(z.object({ value: z.string(), label: z.string() })),
            label: z.string(),
            previousLabel: z.string(),
            /** The chart's buckets: days, or months for a year. */
            labels: z.array(z.string()),
            sections: z.array(SectionSchema),
            /** The cards they may put on My overview, with where each is from. */
            choices: z.array(z.object({ key: z.string(), label: z.string(), section: z.string() })),
          }),
        },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not on the team', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

/** "1 test payment not counted", "$38 in test payments not counted". */
const testNote = (n: number, money: boolean) =>
  n === 0
    ? undefined
    : money
      ? `$${Number.isInteger(n) ? n : n.toFixed(2)} in test payments not counted`
      : `${n} test ${n === 1 ? 'one' : 'ones'} not counted`;

/** The tiles, by key: a label, and for money, so. */
const PERIOD: Record<string, { label: string; money?: boolean }> = {
  newUsers: { label: 'New users' },
  newListings: { label: 'New listings' },
  offers: { label: 'Offers made' },
  deals: { label: 'Confirmed deals' },
  valueSwapped: { label: 'Value swapped', money: true },
  revenue: { label: 'Revenue', money: true },
  reportsReceived: { label: 'Reports received' },
  reportsHandled: { label: 'Reports handled' },
  reportsYouHandled: { label: 'Reports you handled' },
  actionsTaken: { label: 'Actions taken' },
  appealsDecided: { label: 'Appeals decided' },
  newStores: { label: 'New stores' },
  passesSold: { label: 'Store passes sold' },
  boostsSold: { label: 'Boosts sold' },
  paymentsMade: { label: 'Payments made' },
  paymentsFailed: { label: 'Failed payments' },
  listingViews: { label: 'Listing views' },
  reveals: { label: 'Number reveals' },
};
const STANDING: Record<string, { label: string; note: string }> = {
  activeUsers: { label: 'Active users', note: 'Used the app in the last 30 days' },
  liveListings: { label: 'Live listings', note: 'Right now' },
  payingStores: { label: 'Paying stores', note: 'With a pass running now' },
  verifiedStores: { label: 'Verified stores', note: 'Right now' },
  openReports: { label: 'Open reports', note: 'Waiting or being looked at' },
  overdueReports: { label: 'Waiting over 2 days', note: 'Open reports older than 2 days' },
  restrictedUsers: { label: 'Users suspended or banned', note: 'Right now' },
  appealsWaiting: { label: 'Appeals waiting', note: 'Right now' },
  storesToVerify: { label: 'Stores to verify', note: 'Waiting for a decision' },
  storesToCall: { label: 'Stores to call', note: 'As on the Stores to call tab' },
  passesEnding: { label: 'Passes ending soon', note: 'Within 3 days' },
  passesLapsed: { label: 'Lapsed passes', note: 'Right now' },
};


/** A section as planned: which tiles, before they are worked out. */
interface Planned {
  key: Section['key'];
  title: string;
  tiles: string[];
}

/** Who gets which sections, and the tiles in each, by their departments. */
function sectionsFor(inDept: (department: Department, lead?: boolean) => boolean): Planned[] {
  const executive = inDept('executives');
  const leader = inDept('trust_safety', true);
  const wanted: Planned[] = [];
  if (executive || inDept('board')) {
    wanted.push({
      key: 'business',
      title: 'The business',
      tiles: [
        'newUsers', 'newListings', 'offers', 'deals', 'valueSwapped', 'revenue',
        ...(executive ? ['activeUsers', 'liveListings', 'payingStores', 'verifiedStores', 'openReports', 'appealsWaiting'] : []),
      ],
    });
  }
  if (inDept('trust_safety')) {
    wanted.push({
      key: 'trust',
      title: 'Trust and safety',
      tiles: [
        'reportsReceived', 'reportsHandled', 'reportsYouHandled', 'actionsTaken',
        ...(leader ? ['appealsDecided'] : []),
        'openReports', 'overdueReports', 'restrictedUsers',
        ...(leader ? ['appealsWaiting', 'storesToVerify'] : []),
      ],
    });
  }
  if (inDept('sales')) {
    wanted.push({
      key: 'sales',
      title: 'Sales',
      tiles: ['newStores', 'passesSold', 'storesToCall', 'passesEnding', 'passesLapsed', 'payingStores'],
    });
  }
  if (inDept('finance')) {
    wanted.push({ key: 'finance', title: 'Finance', tiles: ['revenue', 'paymentsMade', 'paymentsFailed', 'passesSold', 'boostsSold'] });
  }
  if (inDept('marketing')) {
    wanted.push({ key: 'marketing', title: 'Marketing', tiles: ['newUsers', 'activeUsers', 'listingViews', 'reveals'] });
  }

  return wanted;
}

/** Whether this person is in a department (as its leader, where asked),
    the super admin being in all; and whether they are on the team. */
async function departmentsOf(viewer: Parameters<typeof staffOf>[0]) {
  const superAdmin = viewer.role === 'super_admin';
  const staff = await staffOf(viewer);
  const inDept = (department: Department, lead = false) =>
    superAdmin || staff.some((row) => row.department === department && (!lead || row.lead));
  return { inDept, onTeam: superAdmin || staff.length > 0 };
}

/** The cards this person may put on My overview: every tile of their
    sections, once, with the section it is from. */
function choicesFor(wanted: Planned[]) {
  const seen = new Set<string>();
  return wanted.flatMap((section) =>
    section.tiles
      .filter((key) => !seen.has(key) && seen.add(key))
      .map((key) => ({ key, label: (PERIOD[key] ?? STANDING[key])!.label, section: section.title })),
  );
}

overviewRoutes.openapi(read, async (c) => {
  const query = c.req.valid('query');
  const unit: Unit = query.unit;
  const viewer = await personFor(c.get('authUser'));
  const { inDept, onTeam } = await departmentsOf(viewer);
  if (!onTeam) return c.json({ error: 'Only our team can see this.' }, 403);

  // The ones to choose from, newest first: from now back to the one the
  // first user joined in, at most a few years of them.
  const now = new Date();
  const [first] = await db.select({ at: sql<Date>`min(${t.people.joinedAt})` }).from(t.people);
  const earliest = first?.at ? new Date(first.at) : now;
  const most = { week: 104, month: 48, year: 10 }[unit];
  const periods: { value: string; label: string }[] = [];
  for (let key = keyOf(unit, now); periods.length < most; key = previousKey(unit, key)) {
    periods.push({ value: key, label: labelOf(unit, key) });
    if (bounds(unit, key)[0] <= earliest) break;
  }
  const period = periods.some((each) => each.value === query.period) ? query.period! : periods[0]!.value;
  const before = previousKey(unit, period);
  const [start, end] = bounds(unit, period);
  const [from] = bounds(unit, before);
  const within = (column: Column) => and(gte(column, from), lt(column, end));
  const labels = bucketsOf(unit, period);

  /** Each query once, however many tiles read it. */
  const memo = new Map<string, Promise<unknown>>();
  const once = <T>(name: string, load: () => Promise<T>): Promise<T> => {
    if (!memo.has(name)) memo.set(name, load());
    return memo.get(name) as Promise<T>;
  };
  const ones = (rows: { at: Date | null }[]): Event[] => rows.filter((row) => row.at).map((row) => ({ at: row.at!, amount: 1 }));
  const n = (rows: { n: number }[]) => rows[0]?.n ?? 0;

  // What happened, as events from the period before to the end of this one.
  const payments = () =>
    once('payments', () =>
      db
        .select({
          at: t.payments.createdAt,
          amount: t.payments.amount,
          status: t.payments.status,
          purpose: t.payments.purpose,
          test: sql<boolean>`${t.payments.provider} = 'test'`,
        })
        .from(t.payments)
        .where(within(t.payments.createdAt)),
    );
  const deals = () =>
    once('deals', () =>
      db
        .select({ at: t.dealChecks.resolvedAt, offerId: t.dealChecks.offerId, cash: t.offers.cashAmount, price: t.saleDetails.price })
        .from(t.dealChecks)
        .leftJoin(t.offers, eq(t.offers.id, t.dealChecks.offerId))
        .leftJoin(t.saleDetails, eq(t.saleDetails.listingId, t.dealChecks.listingId))
        .where(and(eq(t.dealChecks.state, 'confirmed'), isNotNull(t.dealChecks.resolvedAt), within(t.dealChecks.resolvedAt))),
    );
  const paid = (purpose?: 'store_pass' | 'boost', money = false) => async () =>
    (await payments())
      .filter((row) => row.status === 'paid' && (!purpose || row.purpose === purpose))
      .map((row) => ({ at: row.at, amount: money ? row.amount : 1, test: row.test }));
  const EVENTS: Record<string, () => Promise<Event[]>> = {
    newUsers: async () =>
      ones(await db.select({ at: t.people.joinedAt }).from(t.people).where(and(within(t.people.joinedAt), isNull(t.people.deletedAt)))),
    newListings: async () =>
      ones(await db.select({ at: t.listings.publishedAt }).from(t.listings).where(within(t.listings.publishedAt))),
    offers: async () => ones(await db.select({ at: t.offers.createdAt }).from(t.offers).where(within(t.offers.createdAt))),
    deals: async () => ones(await deals()),
    valueSwapped: async () =>
      (await deals()).map((row) => ({ at: row.at!, amount: row.offerId ? (row.cash ?? 0) : (row.price ?? 0) })),
    revenue: paid(undefined, true),
    reportsReceived: async () =>
      ones(await db.select({ at: t.reports.createdAt }).from(t.reports).where(within(t.reports.createdAt))),
    reportsHandled: async () =>
      ones(await db.select({ at: t.reports.closedAt }).from(t.reports).where(within(t.reports.closedAt))),
    reportsYouHandled: async () =>
      ones(
        await db
          .select({ at: t.reports.closedAt })
          .from(t.reports)
          .where(and(within(t.reports.closedAt), eq(t.reports.claimedById, viewer.id))),
      ),
    actionsTaken: async () =>
      ones(
        await db
          .select({ at: t.moderationActions.createdAt })
          .from(t.moderationActions)
          .where(and(within(t.moderationActions.createdAt), ne(t.moderationActions.kind, 'none'))),
      ),
    appealsDecided: async () =>
      ones(await db.select({ at: t.appeals.reviewedAt }).from(t.appeals).where(within(t.appeals.reviewedAt))),
    newStores: async () => ones(await db.select({ at: t.stores.createdAt }).from(t.stores).where(within(t.stores.createdAt))),
    passesSold: paid('store_pass'),
    boostsSold: paid('boost'),
    paymentsMade: paid(),
    paymentsFailed: async () =>
      (await payments()).filter((row) => row.status === 'failed').map((row) => ({ at: row.at, amount: 1, test: row.test })),
    listingViews: async () =>
      ones(await db.select({ at: t.listingViews.viewedAt }).from(t.listingViews).where(within(t.listingViews.viewedAt))),
    reveals: async () => ones(await db.select({ at: t.reveals.createdAt }).from(t.reveals).where(within(t.reveals.createdAt))),
  };

  // What stands today.
  const stores = () => once('stores', () => storeRows(now));
  const NOW: Record<string, () => Promise<number>> = {
    activeUsers: async () =>
      n(
        await db
          .select({ n: count() })
          .from(t.people)
          .where(and(isNull(t.people.deletedAt), gt(t.people.lastSeenAt, new Date(now.getTime() - 30 * DAY)))),
      ),
    liveListings: async () => n(await db.select({ n: count() }).from(t.listings).where(eq(t.listings.status, 'live'))),
    payingStores: async () =>
      n(
        await db
          .select({ n: sql<number>`count(distinct ${t.storePasses.storeId})::int` })
          .from(t.storePasses)
          .innerJoin(t.stores, eq(t.stores.id, t.storePasses.storeId))
          .where(and(lte(t.storePasses.startsAt, now), gt(t.storePasses.endsAt, now), isNull(t.stores.closedAt))),
      ),
    verifiedStores: async () =>
      n(await db.select({ n: count() }).from(t.stores).where(and(isNotNull(t.stores.verifiedAt), isNull(t.stores.closedAt)))),
    openReports: async () => n(await db.select({ n: count() }).from(t.reports).where(inArray(t.reports.state, ['open', 'claimed']))),
    overdueReports: async () =>
      n(
        await db
          .select({ n: count() })
          .from(t.reports)
          .where(and(inArray(t.reports.state, ['open', 'claimed']), lt(t.reports.createdAt, new Date(now.getTime() - 2 * DAY)))),
      ),
    restrictedUsers: async () =>
      n(
        await db
          .select({ n: count() })
          .from(t.people)
          .where(and(inArray(t.people.standing, ['suspended', 'banned']), isNull(t.people.deletedAt))),
      ),
    appealsWaiting: async () => n(await db.select({ n: count() }).from(t.appeals).where(isNull(t.appeals.outcome))),
    storesToVerify: async () =>
      n(
        await db
          .select({ n: count() })
          .from(t.verificationRequests)
          .innerJoin(t.stores, eq(t.stores.id, t.verificationRequests.storeId))
          .where(and(eq(t.verificationRequests.state, 'pending'), isNull(t.stores.closedAt))),
      ),
    storesToCall: async () => (await stores()).filter(toCall).length,
    passesEnding: async () => (await stores()).filter((row) => row.state === 'ending').length,
    passesLapsed: async () => (await stores()).filter((row) => row.state === 'lapsed').length,
  };

  const wanted = sectionsFor(inDept);
  // My overview: the cards they chose, in their order, any they can no
  // longer see left out.
  const choices = choicesFor(wanted);
  const [saved] = await db
    .select({ cards: t.staffOverviewCards.cards })
    .from(t.staffOverviewCards)
    .where(eq(t.staffOverviewCards.personId, viewer.id));
  const chosen = (saved?.cards ?? []).filter((key) => choices.some((choice) => choice.key === key));

  const isCurrent = (event: Event) => event.at >= start;
  const sum = (list: Event[]) => list.reduce((total, event) => total + event.amount, 0);
  const chart = (list: Event[], key: string) => {
    const out = Array.from({ length: labels.length }, () => 0);
    for (const event of list) {
      const i = bucketOf(unit, key, event.at);
      if (i >= 0 && i < out.length) out[i] = (out[i] ?? 0) + event.amount;
    }
    return out;
  };
  const tileOf = async (key: string): Promise<Tile> => {
    const def = PERIOD[key];
    if (def) {
      const events = await EVENTS[key]!();
      const counted = events.filter((event) => !event.test);
      const current = counted.filter(isCurrent);
      const previous = counted.filter((event) => !isCurrent(event));
      const leftOut = sum(events.filter((event) => event.test && isCurrent(event)));
      return {
        key,
        label: def.label,
        kind: 'period',
        money: def.money ?? false,
        current: sum(current),
        previous: sum(previous),
        chart: { current: chart(current, period), previous: chart(previous, before) },
        note: testNote(leftOut, def.money ?? false),
      };
    }
    const standing = STANDING[key]!;
    return { key, label: standing.label, kind: 'now', money: false, current: await NOW[key]!(), note: standing.note };
  };

  const sections: Section[] = await Promise.all(
    [{ key: 'mine' as const, title: 'My overview', tiles: chosen }, ...wanted.filter((section) => section.tiles.length > 0)]
      .map(async (section) => ({
        key: section.key,
        title: section.title,
        // A tile two sections share is worked out once.
        tiles: await Promise.all(section.tiles.map((key) => once(`tile ${key}`, () => tileOf(key)))),
      })),
  );
  if (inDept('devops')) {
    sections.push({
      key: 'devops',
      title: 'DevOps',
      tiles: [],
      note: 'Nothing is recorded for DevOps yet. The health of the site comes with Phase 7.',
    });
  }

  return c.json(
    {
      unit,
      period,
      periods,
      label: labelOf(unit, period),
      previousLabel: labelOf(unit, before),
      labels,
      sections,
      choices,
    },
    200,
  );
});

const saveCards = createRoute({
  method: 'put',
  path: '/staff/overview/cards',
  tags: ['Staff'],
  summary: 'Choose the cards on My overview',
  description:
    'Anyone on the team: the cards for the first tab of their Overview, in the order to show them. Only cards of their own departments are taken; none clears the tab.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ cards: z.array(z.string()).max(60) }) } },
    },
  },
  responses: {
    200: {
      description: 'Saved',
      content: { 'application/json': { schema: z.object({ cards: z.array(z.string()) }) } },
    },
    400: { description: 'A card they may not have', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not on the team', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

overviewRoutes.openapi(saveCards, async (c) => {
  const { cards } = c.req.valid('json');
  const viewer = await personFor(c.get('authUser'));
  const { inDept, onTeam } = await departmentsOf(viewer);
  if (!onTeam) return c.json({ error: 'Only our team can see this.' }, 403);
  const allowed = new Set(choicesFor(sectionsFor(inDept)).map((choice) => choice.key));
  if (cards.some((key) => !allowed.has(key))) {
    return c.json({ error: 'Some of those cards are not for your part of the team.' }, 400);
  }
  const unique = [...new Set(cards)];
  await db
    .insert(t.staffOverviewCards)
    .values({ personId: viewer.id, cards: unique })
    .onConflictDoUpdate({ target: t.staffOverviewCards.personId, set: { cards: unique, updatedAt: new Date() } });
  return c.json({ cards: unique }, 200);
});
