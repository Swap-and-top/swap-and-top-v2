/**
 * Growth, the Marketing section of the Staff console (Phase 7; docs/
 * product/staff-console.md): a month or a year beside the one before.
 * Visits and the sites that sent them come from Umami (umami.ts; sample
 * figures until it is connected); the rest from our own records: new and
 * active users and where the new ones came from, what people search for,
 * each category's listings, views, number reveals and Wanted listings, and how
 * boosts did. Totals only: no names, and a figure about fewer than 5 users
 * is not shown, so no total points at one person.
 *
 * Also the two things the site records for it: a search (`POST
 * /searches`, no sign in, with no one's name on it) and where a new user
 * came from (`POST /me/source`, once, just after they join).
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, asc, count, eq, gt, gte, isNull, like, lt, ne, sql } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { umamiConnected, visitSources, visitTotals, visitsBy } from '../umami';
import { personFor } from './me';
import { bounds, bucketOf, bucketsOf, keyOf, labelOf, previousKey } from './revenue';

export const growthRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();
export const searchRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const DAY = 24 * 60 * 60_000;
const UNITS = ['month', 'year'] as const;
type Unit = (typeof UNITS)[number];
/** Fewer users than this, and the figure is not shown. */
const FEWEST = 5;
const CATEGORIES = t.category.enumValues;

/* ── Recording ────────────────────────────────────────────────────────── */

/** A search as kept: lower case, single spaced, short, and with anything
    like an email or a phone number taken out. Empty when nothing is left. */
export function cleanTerm(typed: string): string {
  return typed
    .toLowerCase()
    .replace(/\S+@\S+/g, ' ')
    .replace(/\+?\d[\d\s().-]{5,}\d/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/** At most this many searches a minute from one address. */
const SEARCHES_A_MINUTE = 30;
const recent = new Map<string, { at: number; n: number }>();

const search = createRoute({
  method: 'post',
  path: '/searches',
  tags: ['Growth'],
  summary: 'Note a search',
  description:
    'Counts a search for Growth, with no one\'s name on it. Anything like an email or a phone number is taken out first; the day\'s and the month\'s counts go up by one.',
  request: {
    body: { content: { 'application/json': { schema: z.object({ q: z.string().max(200) }) } } },
  },
  responses: { 204: { description: 'Noted' } },
});

searchRoutes.openapi(search, async (c) => {
  const term = cleanTerm(c.req.valid('json').q);
  const from = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'here';
  const now = Date.now();
  const mine = recent.get(from);
  const fresh = !mine || now - mine.at > 60_000 ? { at: now, n: 0 } : mine;
  fresh.n += 1;
  recent.set(from, fresh);
  if (recent.size > 5000) recent.clear();
  if (term && fresh.n <= SEARCHES_A_MINUTE) {
    const day = keyOf('day', new Date());
    await db
      .insert(t.searchCounts)
      .values([
        { period: day, term, count: 1 },
        { period: day.slice(0, 7), term, count: 1 },
      ])
      .onConflictDoUpdate({
        target: [t.searchCounts.period, t.searchCounts.term],
        set: { count: sql`${t.searchCounts.count} + 1` },
      });
    // Day counts go after two months; the month's stay.
    if (Math.random() < 0.01) {
      const old = keyOf('day', new Date(now - 62 * DAY));
      await db.delete(t.searchCounts).where(and(like(t.searchCounts.period, '____-__-__'), lt(t.searchCounts.period, old)));
    }
  }
  return c.body(null, 204);
});

const source = createRoute({
  method: 'post',
  path: '/me/source',
  tags: ['Growth'],
  summary: 'Note where you came from',
  description:
    'Sent once by the web app just after someone joins: the campaign\'s source tag, else the site that sent them, else "direct", and the campaign tag. Kept only for an account made in the last day that has none yet.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ source: z.string().trim().min(1).max(80), campaign: z.string().trim().max(80).optional() }),
        },
      },
    },
  },
  responses: {
    204: { description: 'Noted, or already known' },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

searchRoutes.openapi(source, async (c) => {
  const { source: from, campaign } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  await db
    .update(t.people)
    .set({ signupSource: from.toLowerCase(), signupCampaign: campaign?.toLowerCase() || null })
    .where(
      and(
        eq(t.people.id, person.id),
        isNull(t.people.signupSource),
        gt(t.people.joinedAt, new Date(Date.now() - DAY)),
      ),
    );
  return c.body(null, 204);
});

/* ── The Growth page ──────────────────────────────────────────────────── */

const Pair = z.object({ current: z.number(), previous: z.number() });
const Chart = z.object({ labels: z.array(z.string()), current: z.array(z.number()), previous: z.array(z.number()) });

const read = createRoute({
  method: 'get',
  path: '/staff/growth',
  tags: ['Staff'],
  summary: 'Growth for a month or a year',
  description:
    'Marketing: visits and where visitors come from (Umami, or sample figures until it is connected, `sample`), new and active users and where the new ones came from, top searches, each category\'s listings, views, number reveals and Wanted listings, and boosts, beside the period before. Totals only; a figure about fewer than 5 users is left out (null).',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    query: z.object({
      unit: z.enum(UNITS).default('month'),
      period: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
    }),
  },
  responses: {
    200: {
      description: 'The period',
      content: {
        'application/json': {
          schema: z.object({
            unit: z.enum(UNITS),
            period: z.string(),
            label: z.string(),
            previousLabel: z.string(),
            periods: z.array(z.object({ value: z.string(), label: z.string() })),
            visits: z.object({
              /** Sample figures: Umami is not connected yet. */
              sample: z.boolean(),
              visitors: Pair,
              visits: Pair,
              pageViews: Pair,
              chart: Chart,
              sources: z.array(z.object({ name: z.string(), visits: z.number() })),
            }),
            users: z.object({
              newUsers: Pair,
              /** Used the app in the last 30 days, now. */
              active: z.number(),
              chart: Chart,
              /** Where the new ones came from; null where fewer than 5. */
              sources: z.array(z.object({ name: z.string(), users: z.number().nullable(), posted: z.number().nullable() })),
            }),
            searches: z.object({
              total: Pair,
              /** Searched 5 times or more, most first. */
              top: z.array(z.object({ term: z.string(), count: z.number(), previous: z.number() })),
            }),
            categories: z.array(
              z.object({
                category: z.enum(CATEGORIES),
                listings: z.number(),
                views: z.number(),
                reveals: z.number(),
                wanted: z.number(),
              }),
            ),
            boosts: z.object({ started: Pair, views: Pair, reveals: Pair }),
          }),
        },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not in Marketing', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

/** Each period's searches: one month's rows, or a year's twelve. */
export async function searchesIn(unit: Unit, key: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ term: t.searchCounts.term, n: sql<number>`sum(${t.searchCounts.count})::int` })
    .from(t.searchCounts)
    .where(unit === 'month' ? eq(t.searchCounts.period, key) : like(t.searchCounts.period, `${key}-__`))
    .groupBy(t.searchCounts.term);
  return new Map(rows.map((row) => [row.term, row.n]));
}

/** What boosts brought from `start` to `end`: boosts started, and the views
    and number reveals their listings had while a boost ran. */
export async function boostsIn(start: Date, end: Date) {
  const during = (at: typeof t.listingViews.viewedAt | typeof t.reveals.createdAt, listing: typeof t.listingViews.listingId | typeof t.reveals.listingId) =>
    sql`exists (select 1 from ${t.boosts} b where b.listing_id = ${listing} and ${at} >= b.starts_at and ${at} < coalesce(b.stopped_at, b.ends_at))`;
  const between = (at: typeof t.listingViews.viewedAt | typeof t.reveals.createdAt) => and(gte(at, start), lt(at, end));
  const [started, views, reveals] = await Promise.all([
    db.select({ n: count() }).from(t.boosts).where(and(gte(t.boosts.startsAt, start), lt(t.boosts.startsAt, end))),
    db
      .select({ n: count() })
      .from(t.listingViews)
      .where(and(between(t.listingViews.viewedAt), during(t.listingViews.viewedAt, t.listingViews.listingId))),
    db
      .select({ n: count() })
      .from(t.reveals)
      .where(and(between(t.reveals.createdAt), during(t.reveals.createdAt, t.reveals.listingId))),
  ]);
  return { started: started[0]?.n ?? 0, views: views[0]?.n ?? 0, reveals: reveals[0]?.n ?? 0 };
}

/** Each category's listings published, views, reveals and Wanted listings. */
export async function categoriesIn(start: Date, end: Date) {
  const [listed, views, reveals] = await Promise.all([
    db
      .select({
        category: t.listings.category,
        listings: sql<number>`count(*) filter (where ${t.listings.type} <> 'request')::int`,
        wanted: sql<number>`count(*) filter (where ${t.listings.type} = 'request')::int`,
      })
      .from(t.listings)
      .where(and(gte(t.listings.publishedAt, start), lt(t.listings.publishedAt, end)))
      .groupBy(t.listings.category),
    db
      .select({ category: t.listings.category, n: count() })
      .from(t.listingViews)
      .innerJoin(t.listings, eq(t.listings.id, t.listingViews.listingId))
      .where(and(gte(t.listingViews.viewedAt, start), lt(t.listingViews.viewedAt, end)))
      .groupBy(t.listings.category),
    db
      .select({ category: t.listings.category, n: count() })
      .from(t.reveals)
      .innerJoin(t.listings, eq(t.listings.id, t.reveals.listingId))
      .where(and(gte(t.reveals.createdAt, start), lt(t.reveals.createdAt, end)))
      .groupBy(t.listings.category),
  ]);
  return CATEGORIES.map((category) => {
    const row = listed.find((each) => each.category === category);
    return {
      category,
      listings: row?.listings ?? 0,
      wanted: row?.wanted ?? 0,
      views: views.find((each) => each.category === category)?.n ?? 0,
      reveals: reveals.find((each) => each.category === category)?.n ?? 0,
    };
  });
}

growthRoutes.openapi(read, async (c) => {
  const query = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'marketing'))) return c.json({ error: 'Only Marketing can see this.' }, 403);

  const unit = query.unit;
  const now = new Date();
  const valid = query.period !== undefined && keyOf(unit, bounds(unit, query.period)[0]) === query.period;
  const period = valid ? query.period! : keyOf(unit, now);
  const before = previousKey(unit, period);
  const [start, end] = bounds(unit, period);
  const [prevStart, prevEnd] = bounds(unit, before);
  const labels = bucketsOf(unit, period);
  const by = unit === 'month' ? 'day' : 'month';
  /** A visits key ("2026-11-03" or "2026-11") as its chart bucket. */
  const slot = (key: string) => (by === 'day' ? Number(key.slice(8, 10)) - 1 : Number(key.slice(5, 7)) - 1);

  const joinedIn = (from: Date, to: Date) =>
    db
      .select({ at: t.people.joinedAt, source: t.people.signupSource, id: t.people.id })
      .from(t.people)
      .where(and(gte(t.people.joinedAt, from), lt(t.people.joinedAt, to)));

  const [
    totals,
    previousTotals,
    visitsNow,
    visitsBefore,
    sources,
    joined,
    joinedBefore,
    active,
    posters,
    searches,
    searchesBefore,
    categories,
    boosts,
    boostsBefore,
    first,
  ] = await Promise.all([
    visitTotals(start, end),
    visitTotals(prevStart, prevEnd),
    visitsBy(by, start, end),
    visitsBy(by, prevStart, prevEnd),
    visitSources(start, end),
    joinedIn(start, end),
    joinedIn(prevStart, prevEnd),
    db
      .select({ n: count() })
      .from(t.people)
      .where(and(isNull(t.people.deletedAt), gt(t.people.lastSeenAt, new Date(now.getTime() - 30 * DAY)))),
    db.selectDistinct({ id: t.listings.ownerId }).from(t.listings).where(ne(t.listings.status, 'draft')),
    searchesIn(unit, period),
    searchesIn(unit, before),
    categoriesIn(start, end),
    boostsIn(start, end),
    boostsIn(prevStart, prevEnd),
    db.select({ at: t.people.joinedAt }).from(t.people).orderBy(asc(t.people.joinedAt)).limit(1),
  ]);

  // The charts: visits and new users in each bucket, this period and the
  // one before.
  const visitChart = (counts: Map<string, number>) => {
    const out = labels.map(() => 0);
    for (const [key, n] of counts) {
      const i = slot(key);
      if (i >= 0 && i < out.length) out[i] = (out[i] ?? 0) + n;
    }
    return out;
  };
  const userChart = (rows: { at: Date }[], key: string) => {
    const out = labels.map(() => 0);
    for (const row of rows) {
      const i = bucketOf(unit, key, row.at);
      if (i >= 0 && i < out.length) out[i] = (out[i] ?? 0) + 1;
    }
    return out;
  };

  // Where the new users came from, with how many went on to post; sources
  // with fewer than 5 put together as Other, and Other left out when it is
  // fewer than 5 too.
  const posted = new Set(posters.map((row) => row.id));
  const bySource = new Map<string, { users: number; posted: number }>();
  for (const row of joined) {
    const name = row.source ?? 'not recorded';
    const each = bySource.get(name) ?? { users: 0, posted: 0 };
    each.users += 1;
    if (posted.has(row.id)) each.posted += 1;
    bySource.set(name, each);
  }
  const other = { users: 0, posted: 0 };
  const userSources: { name: string; users: number | null; posted: number | null }[] = [];
  for (const [name, each] of [...bySource].sort((a, b) => b[1].users - a[1].users)) {
    if (each.users < FEWEST) {
      other.users += each.users;
      other.posted += each.posted;
    } else {
      userSources.push({ name, users: each.users, posted: each.posted < FEWEST ? null : each.posted });
    }
  }
  if (other.users > 0) {
    userSources.push({
      name: 'other',
      users: other.users < FEWEST ? null : other.users,
      posted: other.posted < FEWEST ? null : other.posted,
    });
  }

  // The periods to choose from: from the first user, or now, to now.
  const periods: { value: string; label: string }[] = [];
  const earliest = first[0]?.at ?? now;
  for (let key = keyOf(unit, now); periods.length < (unit === 'month' ? 48 : 10); key = previousKey(unit, key)) {
    periods.push({ value: key, label: labelOf(unit, key) });
    if (bounds(unit, key)[0] <= earliest) break;
  }

  // A period still running: its line stops at today.
  const upTo = period === keyOf(unit, now) ? bucketOf(unit, period, now) + 1 : labels.length;

  const sum = (counts: Map<string, number>) => [...counts.values()].reduce((a, b) => a + b, 0);

  return c.json(
    {
      unit,
      period,
      label: labelOf(unit, period),
      previousLabel: labelOf(unit, before),
      periods,
      visits: {
        sample: !umamiConnected(),
        visitors: { current: totals.visitors, previous: previousTotals.visitors },
        visits: { current: totals.visits, previous: previousTotals.visits },
        pageViews: { current: totals.pageViews, previous: previousTotals.pageViews },
        chart: { labels, current: visitChart(visitsNow).slice(0, upTo), previous: visitChart(visitsBefore) },
        sources,
      },
      users: {
        newUsers: { current: joined.length, previous: joinedBefore.length },
        active: active[0]?.n ?? 0,
        chart: { labels, current: userChart(joined, period).slice(0, upTo), previous: userChart(joinedBefore, before) },
        sources: userSources,
      },
      searches: {
        total: { current: sum(searches), previous: sum(searchesBefore) },
        top: [...searches]
          .filter(([, n]) => n >= FEWEST)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([term, n]) => ({ term, count: n, previous: searchesBefore.get(term) ?? 0 })),
      },
      categories,
      boosts: {
        started: { current: boosts.started, previous: boostsBefore.started },
        views: { current: boosts.views, previous: boostsBefore.views },
        reveals: { current: boosts.reveals, previous: boostsBefore.reveals },
      },
    },
    200,
  );
});
