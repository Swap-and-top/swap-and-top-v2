/**
 * Health, the DevOps section of the Staff console (Phase 7; docs/product/
 * staff-console.md, sections 8 and 9: health only, no user data, no
 * exports). How things stand now: how fast the database answers, its
 * connections and size, the deploy that is running, and whether the store
 * pass check (passes.ts, run as pages are read) is keeping up. Then the
 * last 30 days of errors and slow requests (recordRequests.ts): a day at a
 * time, by route, the latest, and each month's totals for the last year.
 * Only route patterns are kept, never addresses, so nothing here points at
 * anyone.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, desc, gte, isNull, lt, lte, eq, sql as q } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db, sql } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { monthOf, SLOW_MS } from '../recordRequests';
import { personFor } from './me';
import { keyOf } from './revenue';

export const devopsRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const HARARE = 2 * 60 * 60_000;
const DAY = 24 * 60 * 60_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** How long the pass check may be behind before it counts as behind: it
    runs at most once a minute, and only while pages are read. */
const BEHIND_MS = 15 * 60_000;

/** "3 Nov, 14:05", in Harare's time. */
function atLabel(at: Date): string {
  const d = new Date(at.getTime() + HARARE);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hh}:${mm}`;
}

/** The deploy running: from the host's settings (Vercel's own, or
    COMMIT_SHA, COMMIT_MESSAGE, COMMIT_BRANCH and APP_HOST on our own
    server, from the Dockerfile); none on a laptop. */
function deploy() {
  const env = process.env;
  const commit = env.VERCEL_GIT_COMMIT_SHA ?? env.COMMIT_SHA;
  if (!commit) return null;
  return {
    commit: commit.slice(0, 7),
    message: (env.VERCEL_GIT_COMMIT_MESSAGE ?? env.COMMIT_MESSAGE ?? '').split('\n')[0]!.slice(0, 120),
    branch: env.VERCEL_GIT_COMMIT_REF ?? env.COMMIT_BRANCH ?? null,
    host: env.VERCEL ? 'Vercel' : (env.APP_HOST ?? null),
  };
}

const read = createRoute({
  method: 'get',
  path: '/staff/health',
  tags: ['Staff'],
  summary: 'Health of the site',
  description:
    'DevOps: the database\'s answer time, connections and size, the deploy running, whether the store pass check is keeping up, and the last 30 days of errors and slow requests (over 2 seconds), by day, by route and the latest, with each month\'s totals for the last year. No user data.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'How things stand',
      content: {
        'application/json': {
          schema: z.object({
            database: z.object({
              /** How long `select 1` took, in milliseconds. */
              answerMs: z.number(),
              connections: z.number(),
              maxConnections: z.number(),
              /** In megabytes. */
              sizeMb: z.number(),
            }),
            deploy: z
              .object({ commit: z.string(), message: z.string(), branch: z.string().nullable(), host: z.string().nullable() })
              .nullable(),
            /** Recording runs on the live site only. */
            recording: z.boolean(),
            passCheck: z.object({
              /** Passes ended over 15 minutes ago and not yet dealt with. */
              endedWaiting: z.number(),
              /** Suspensions over 15 minutes past their end and not lifted. */
              suspensionsWaiting: z.number(),
            }),
            slowMs: z.number(),
            last30: z.object({
              errors: z.number(),
              slow: z.number(),
              /** The slow requests' average time, in milliseconds. */
              slowAverageMs: z.number(),
              chart: z.object({ labels: z.array(z.string()), errors: z.array(z.number()), slow: z.array(z.number()) }),
              routes: z.array(
                z.object({ route: z.string(), errors: z.number(), slow: z.number(), averageMs: z.number() }),
              ),
              latest: z.array(
                z.object({
                  id: z.string(),
                  atLabel: z.string(),
                  kind: z.enum(['error', 'slow']),
                  route: z.string(),
                  status: z.number(),
                  ms: z.number(),
                }),
              ),
            }),
            months: z.array(z.object({ month: z.string(), label: z.string(), errors: z.number(), slow: z.number() })),
          }),
        },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not in DevOps', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

devopsRoutes.openapi(read, async (c) => {
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'devops'))) return c.json({ error: 'Only DevOps can see this.' }, 403);
  return c.json(await healthReport(), 200);
});

/** Everything the Health page shows, as of now. */
export async function healthReport(now = new Date()) {
  const since = new Date(now.getTime() - 30 * DAY);
  const behind = new Date(now.getTime() - BEHIND_MS);

  // Timed once the connection is open, so it is the database's answer
  // alone.
  await sql`select 1`;
  const started = Date.now();
  await sql`select 1`;
  const answerMs = Date.now() - started;

  // The 30 days' labels, oldest first: "4 Oct" to "3 Nov".
  const dayKeys = Array.from({ length: 30 }, (_, n) => keyOf('day', new Date(now.getTime() - (29 - n) * DAY)));
  const dayLabel = (key: string) => `${Number(key.slice(8, 10))} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;

  // The last 12 months' keys, oldest first.
  const monthKeys: string[] = [];
  for (let n = 11; n >= 0; n--) {
    const d = new Date(now.getTime() + HARARE);
    monthKeys.push(monthOf(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 15))));
  }

  const [connections, size, endedWaiting, suspensionsWaiting, issues, latest, months] = await Promise.all([
    sql<{ n: number; max: number }[]>`select count(*)::int as n, current_setting('max_connections')::int as max from pg_stat_activity`,
    sql<{ mb: number }[]>`select round(pg_database_size(current_database()) / 1048576.0)::int as mb`,
    db
      .select({ n: count() })
      .from(t.storePasses)
      .where(and(lte(t.storePasses.endsAt, behind), isNull(t.storePasses.lapseHandledAt))),
    db
      .select({ n: count() })
      .from(t.people)
      .where(and(eq(t.people.standing, 'suspended'), lt(t.people.suspendedUntil, behind))),
    db
      .select({ kind: t.requestIssues.kind, method: t.requestIssues.method, route: t.requestIssues.route, ms: t.requestIssues.ms, at: t.requestIssues.at })
      .from(t.requestIssues)
      .where(gte(t.requestIssues.at, since)),
    db.select().from(t.requestIssues).orderBy(desc(t.requestIssues.at)).limit(20),
    db
      .select({
        month: t.requestIssueMonths.month,
        kind: t.requestIssueMonths.kind,
        n: q<number>`sum(${t.requestIssueMonths.count})::int`,
      })
      .from(t.requestIssueMonths)
      .where(gte(t.requestIssueMonths.month, monthKeys[0]!))
      .groupBy(t.requestIssueMonths.month, t.requestIssueMonths.kind),
  ]);

  const errors = issues.filter((row) => row.kind === 'error');
  const slow = issues.filter((row) => row.kind === 'slow');
  const perDay = (rows: typeof issues) => {
    const out = dayKeys.map(() => 0);
    for (const row of rows) {
      const i = dayKeys.indexOf(keyOf('day', row.at));
      if (i >= 0) out[i] = (out[i] ?? 0) + 1;
    }
    return out;
  };

  // By route, the most first.
  const byRoute = new Map<string, { errors: number; slow: number; ms: number }>();
  for (const row of issues) {
    const name = `${row.method} ${row.route}`;
    const each = byRoute.get(name) ?? { errors: 0, slow: 0, ms: 0 };
    if (row.kind === 'error') each.errors += 1;
    else each.slow += 1;
    each.ms += row.ms;
    byRoute.set(name, each);
  }
  const routes = [...byRoute]
    .map(([route, each]) => ({
      route,
      errors: each.errors,
      slow: each.slow,
      averageMs: Math.round(each.ms / (each.errors + each.slow)),
    }))
    .sort((a, b) => b.errors - a.errors || b.slow - a.slow)
    .slice(0, 15);

  const monthCount = (month: string, kind: 'error' | 'slow') =>
    months.find((row) => row.month === month && row.kind === kind)?.n ?? 0;

  return {
      database: {
        answerMs,
        connections: connections[0]?.n ?? 0,
        maxConnections: connections[0]?.max ?? 0,
        sizeMb: size[0]?.mb ?? 0,
      },
      deploy: deploy(),
      recording: process.env.NODE_ENV === 'production',
      passCheck: { endedWaiting: endedWaiting[0]?.n ?? 0, suspensionsWaiting: suspensionsWaiting[0]?.n ?? 0 },
      slowMs: SLOW_MS,
      last30: {
        errors: errors.length,
        slow: slow.length,
        slowAverageMs: slow.length ? Math.round(slow.reduce((sum, row) => sum + row.ms, 0) / slow.length) : 0,
        chart: { labels: dayKeys.map(dayLabel), errors: perDay(errors), slow: perDay(slow) },
        routes,
        latest: latest.map((row) => ({
          id: row.id,
          atLabel: atLabel(row.at),
          kind: row.kind as 'error' | 'slow',
          route: `${row.method} ${row.route}`,
          status: row.status,
          ms: row.ms,
        })),
      },
      months: monthKeys.map((month) => ({
        month,
        label: `${MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`,
        errors: monthCount(month, 'error'),
        slow: monthCount(month, 'slow'),
      })),
  };
}
