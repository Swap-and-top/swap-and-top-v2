/**
 * Errors and slow requests, kept for DevOps (Phase 7; docs/product/
 * staff-console.md, sections 8 and 9: no personal data). A request the API
 * answers with a server error, or that takes over 2 seconds, is written to
 * `request_issues` with its route's pattern (`/api/listings/{id}`, never
 * the address itself), its status and how long it took, and counted in
 * `request_issue_months`. Nothing is waited for, so a slow database never
 * makes a request slower. Rows over two months old are cleared now and then;
 * the monthly totals stay, so one year can be put beside the next.
 */

import type { MiddlewareHandler } from 'hono';
import { matchedRoutes } from 'hono/route';
import { lt, sql } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';

/** Slower than this is slow. */
export const SLOW_MS = 2000;
/** How long each one is kept. */
const KEEP_MS = 62 * 24 * 60 * 60_000;
/** How often old rows are cleared, at most, from one server. */
const CLEAR_EVERY_MS = 60 * 60_000;
let clearedAt = 0;

/** "2026-11", in Harare's time (UTC+2), as Revenue counts months. */
export const monthOf = (at: Date) => new Date(at.getTime() + 2 * 60 * 60_000).toISOString().slice(0, 7);

/** The pattern of the route that answered: `/api/listings/:id`. */
function routeOf(c: Parameters<MiddlewareHandler>[0]): string {
  const routes = matchedRoutes(c);
  const last = routes[routes.length - 1]?.path ?? '';
  return !last || last.endsWith('*') ? 'not found' : last;
}

async function record(kind: 'error' | 'slow', method: string, route: string, status: number, ms: number) {
  const at = new Date();
  await db.insert(t.requestIssues).values({ kind, method, route, status, ms, at });
  await db
    .insert(t.requestIssueMonths)
    .values({ month: monthOf(at), route: `${method} ${route}`, kind, count: 1, totalMs: ms })
    .onConflictDoUpdate({
      target: [t.requestIssueMonths.month, t.requestIssueMonths.route, t.requestIssueMonths.kind],
      set: {
        count: sql`${t.requestIssueMonths.count} + 1`,
        totalMs: sql`${t.requestIssueMonths.totalMs} + ${ms}`,
      },
    });
  if (at.getTime() - clearedAt > CLEAR_EVERY_MS) {
    clearedAt = at.getTime();
    await db.delete(t.requestIssues).where(lt(t.requestIssues.at, new Date(at.getTime() - KEEP_MS)));
  }
}

/** Only the live site's: a laptop's requests to the shared database are
    slow for being far from it, not for anything to fix. */
const LIVE = process.env.NODE_ENV === 'production';

export const recordRequests: MiddlewareHandler = async (c, next) => {
  if (!LIVE) return next();
  const started = Date.now();
  await next();
  const ms = Date.now() - started;
  const status = c.res.status;
  const kind = status >= 500 ? 'error' : ms > SLOW_MS ? 'slow' : null;
  if (kind) void record(kind, c.req.method, routeOf(c), status, ms).catch(() => undefined);
};
