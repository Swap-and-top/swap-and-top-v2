/**
 * Views, and a store's Stats (docs/product/store-console.md).
 *
 * A view is recorded when someone opens a listing's page: once a device a
 * listing every half hour, never its owner (`listing_views`, and one more on
 * the listing's `viewCount`). Stats then counts, for the store's listings
 * and a stretch of time, what is recorded: views, number reveals, offers
 * received and deals both sides confirmed, by the hour, day or month in
 * Harare's time, against the same stretch just before; its best items; and
 * where its leads come from.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, eq, gt, gte, inArray, lt, sql } from 'drizzle-orm';
import { optionalAuth, requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { paidUntil } from '../passes';
import { ErrorSchema } from '../schemas';
import { personFor } from './me';
import { isMember } from './post';
import { deviceHashOf } from './reveals';

export const statsRoutes = new OpenAPIHono<{ Variables: { authUser?: AuthUser } }>();

/* --- recording a view ------------------------------------------------------ */

const view = createRoute({
  method: 'post',
  path: '/listings/{id}/views',
  tags: ['Listings'],
  summary: 'Record a view',
  description:
    'Someone opened the listing\'s page. Counted once a device every half hour, and never for its owner. Send the device\'s own random id in `X-Device`.',
  middleware: [optionalAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    201: { description: 'Noted', content: { 'application/json': { schema: z.object({ counted: z.boolean() }) } } },
  },
});

statsRoutes.openapi(view, async (c) => {
  const { id } = c.req.valid('param');
  const authUser = c.get('authUser');
  const person = authUser ? await personFor(authUser) : null;
  const [listing] = await db
    .select({ ownerId: t.listings.ownerId, status: t.listings.status })
    .from(t.listings)
    .where(eq(t.listings.id, id));
  if (!listing || listing.status !== 'live' || listing.ownerId === person?.id) {
    return c.json({ counted: false }, 201);
  }
  const deviceHash = deviceHashOf(c.req.header('X-Device'), c.req.header('x-forwarded-for')?.split(',')[0]);
  const [recent] = await db
    .select({ id: t.listingViews.id })
    .from(t.listingViews)
    .where(
      and(
        eq(t.listingViews.listingId, id),
        eq(t.listingViews.deviceHash, deviceHash),
        gt(t.listingViews.viewedAt, new Date(Date.now() - 30 * 60 * 1000)),
      ),
    );
  if (recent) return c.json({ counted: false }, 201);
  await db.insert(t.listingViews).values({ listingId: id, deviceHash });
  await db
    .update(t.listings)
    .set({ viewCount: sql`${t.listings.viewCount} + 1` })
    .where(eq(t.listings.id, id));
  return c.json({ counted: true }, 201);
});

/* --- a store's stats ------------------------------------------------------- */

const RANGES = ['today', 'week', 'month', 'year', 'all'] as const;
type Range = (typeof RANGES)[number];

const Figures = z.object({ views: z.number(), reveals: z.number(), offers: z.number(), deals: z.number() });
type FiguresT = z.infer<typeof Figures>;
const NONE = (): FiguresT => ({ views: 0, reveals: 0, offers: 0, deals: 0 });

const StatsSchema = z
  .object({
    buckets: z.array(Figures.extend({ label: z.string(), short: z.string() })),
    totals: Figures,
    /** The same length of time just before. */
    previous: Figures,
    /** "yesterday", "last week"; empty for all time. */
    against: z.string(),
    best: z.array(Figures.extend({ listingId: z.string(), name: z.string() })),
    /** Of reveals by WhatsApp or call, the share by WhatsApp; null with none. */
    whatsappShare: z.number().nullable(),
    /** Reveals a listing while sponsored against while not, "3.4x"; null
        until there are some of each. */
    sponsoredLift: z.string().nullable(),
  })
  .openapi('StoreStats');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** Harare is two hours ahead of UTC, all year. */
const OFFSET = 2 * HOUR;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A moment in Harare's time, as a date whose UTC fields read locally. */
const local = (at: Date) => new Date(at.getTime() + OFFSET);
/** Back from Harare's time to the moment. */
const moment = (localDate: Date) => new Date(localDate.getTime() - OFFSET);

function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? 'am' : 'pm'}`;
}

interface Bucket {
  start: Date;
  end: Date;
  label: string;
  short: string;
}

/** The buckets of a stretch, oldest first, and when the stretch begins. */
function bucketsFor(range: Range, now: Date, opened: Date): Bucket[] {
  const today = local(now);
  today.setUTCHours(0, 0, 0, 0);
  if (range === 'today') {
    const hours = local(now).getUTCHours();
    return Array.from({ length: hours + 1 }, (_, h) => {
      const start = new Date(today.getTime() + h * HOUR);
      return { start: moment(start), end: moment(new Date(start.getTime() + HOUR)), label: hourLabel(h), short: hourLabel(h) };
    });
  }
  if (range === 'week' || range === 'month') {
    const count = range === 'week' ? 7 : 30;
    return Array.from({ length: count }, (_, i) => {
      const start = new Date(today.getTime() - (count - 1 - i) * DAY);
      const day = DAYS[start.getUTCDay()]!;
      return {
        start: moment(start),
        end: moment(new Date(start.getTime() + DAY)),
        label: `${day} ${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}`,
        short: count === 7 ? day : String(start.getUTCDate()),
      };
    });
  }
  // A year by the month; all time by the month since the store opened.
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  let count = 12;
  if (range === 'all') {
    const from = local(opened);
    count = Math.max(
      1,
      (today.getUTCFullYear() - from.getUTCFullYear()) * 12 + today.getUTCMonth() - from.getUTCMonth() + 1,
    );
  }
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - (count - 1 - i), 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return {
      start: moment(start),
      end: moment(end),
      label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
      short: MONTHS[start.getUTCMonth()]!,
    };
  });
}

const AGAINST: Record<Range, string> = {
  today: 'yesterday',
  week: 'last week',
  month: 'the month before',
  year: 'the year before',
  all: '',
};

const stats = createRoute({
  method: 'get',
  path: '/stores/{id}/stats',
  tags: ['Stores'],
  summary: 'A store\'s stats',
  description:
    'Views, number reveals, offers received and confirmed deals on the store\'s listings over a stretch of time (today by the hour, a week or a month by the day, a year or all time by the month, in Harare\'s time), against the stretch before; its best items, most reveals first; and where its leads come from. Its owner and staff only, while a store pass covers now.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ range: z.enum(RANGES).default('week') }),
  },
  responses: {
    200: { description: 'The stats', content: { 'application/json': { schema: StatsSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    402: { description: 'No store pass covers now', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not the store\'s owner or staff', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

statsRoutes.openapi(stats, async (c) => {
  const { id } = c.req.valid('param');
  const { range } = c.req.valid('query');
  const person = await personFor(c.get('authUser')!);
  if (!(await isMember(person.id, id))) {
    return c.json({ error: 'Only the store\'s owner and staff can see its stats.' }, 403);
  }
  if (!(await paidUntil(id))) return c.json({ error: 'The Store console needs a store pass.', code: 'pass' }, 402);

  const [store] = await db.select({ createdAt: t.stores.createdAt }).from(t.stores).where(eq(t.stores.id, id));
  const now = new Date();
  const buckets = bucketsFor(range, now, store?.createdAt ?? now);
  const from = buckets[0]!.start;
  const to = now;
  // The stretch before, of the same length (none for all time).
  const before = range === 'all' ? from : new Date(from.getTime() - (buckets.at(-1)!.end.getTime() - from.getTime()));

  const listings = await db
    .select({ id: t.listings.id, title: t.listings.title, type: t.listings.type, status: t.listings.status })
    .from(t.listings)
    .where(eq(t.listings.storeId, id));
  const ids = listings.map((listing) => listing.id);
  if (ids.length === 0) {
    return c.json(
      {
        buckets: buckets.map((b) => ({ ...NONE(), label: b.label, short: b.short })),
        totals: NONE(),
        previous: NONE(),
        against: AGAINST[range],
        best: [],
        whatsappShare: null,
        sponsoredLift: null,
      },
      200,
    );
  }

  // Each event's listing and time, from the start of the stretch before.
  const [views, reveals, offers, deals] = await Promise.all([
    db
      .select({ listingId: t.listingViews.listingId, at: t.listingViews.viewedAt })
      .from(t.listingViews)
      .where(and(inArray(t.listingViews.listingId, ids), gte(t.listingViews.viewedAt, before), lt(t.listingViews.viewedAt, to))),
    db
      .select({ listingId: t.reveals.listingId, at: t.reveals.createdAt, way: t.reveals.way, slot: t.reveals.slot })
      .from(t.reveals)
      .where(and(inArray(t.reveals.listingId, ids), gte(t.reveals.createdAt, before), lt(t.reveals.createdAt, to))),
    db
      .select({ listingId: t.offers.listingId, at: t.offers.createdAt })
      .from(t.offers)
      .where(and(inArray(t.offers.listingId, ids), gte(t.offers.createdAt, before), lt(t.offers.createdAt, to))),
    db
      .select({ listingId: t.dealChecks.listingId, at: t.dealChecks.resolvedAt })
      .from(t.dealChecks)
      .where(
        and(
          inArray(t.dealChecks.listingId, ids),
          eq(t.dealChecks.state, 'confirmed'),
          gte(t.dealChecks.resolvedAt, before),
          lt(t.dealChecks.resolvedAt, to),
        ),
      ),
  ]);
  const events: Record<keyof FiguresT, { listingId: string; at: Date | null }[]> = { views, reveals, offers, deals };
  const metrics = Object.keys(events) as (keyof FiguresT)[];

  const out = buckets.map((b) => ({ ...NONE(), label: b.label, short: b.short }));
  const totals = NONE();
  const previous = NONE();
  const byListing = new Map<string, FiguresT>();
  for (const metric of metrics) {
    for (const event of events[metric]) {
      if (!event.at) continue;
      if (event.at < from) {
        previous[metric] += 1;
        continue;
      }
      totals[metric] += 1;
      const index = buckets.findIndex((b) => event.at! >= b.start && event.at! < b.end);
      if (index >= 0) out[index]![metric] += 1;
      const item = byListing.get(event.listingId) ?? NONE();
      item[metric] += 1;
      byListing.set(event.listingId, item);
    }
  }

  // Best items: the store's live items for sale, most reveals, then views.
  const best = listings
    .filter((listing) => listing.type === 'sale' && listing.status === 'live')
    .map((listing) => ({ listingId: listing.id, name: listing.title, ...(byListing.get(listing.id) ?? NONE()) }))
    .sort((a, b) => b.reveals - a.reveals || b.views - a.views)
    .slice(0, 5);

  const inRange = reveals.filter((r) => r.at >= from);
  const byPhone = inRange.filter((r) => r.way === 'whatsapp' || r.way === 'call');
  const whatsappShare = byPhone.length ? byPhone.filter((r) => r.way === 'whatsapp').length / byPhone.length : null;

  // Reveals a listing gets while sponsored against while not, per listing.
  const sponsored = inRange.filter((r) => r.slot === 'sponsored');
  const organic = inRange.filter((r) => r.slot !== 'sponsored');
  const per = (rows: typeof inRange) => rows.length / Math.max(1, new Set(rows.map((r) => r.listingId)).size);
  const sponsoredLift =
    sponsored.length > 0 && organic.length > 0 ? `${(per(sponsored) / per(organic)).toFixed(1)}x` : null;

  return c.json(
    { buckets: out, totals, previous, against: AGAINST[range], best, whatsappShare, sponsoredLift },
    200,
  );
});
