/**
 * Revenue, the Finance section of the Staff console (docs/product/
 * staff-console.md): store passes and boosts, a day, a week, a month or a
 * year at a time, against the one before or any other of the same length
 * (`against`). Revenue counts paid payments. Until Paynow
 * is live every payment is a test one (`provider = 'test'`): those count
 * only when asked for (`test=1`, and by default while no real payment has
 * been made, so the page shows something), and the page says so plainly
 * (the business definitions, 2026-10-30). Look only. A Finance leader
 * downloads the period for the accounts (`GET /staff/revenue/export`),
 * logged, holding no more personal data than a name.
 *
 * Periods run in Harare's time (UTC+2): a week from Monday.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, asc, desc, eq, gte, lt, ne } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { personFor } from './me';

export const revenueRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const HARARE = 2 * 60 * 60_000;
const DAY = 24 * 60 * 60_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UNITS = ['day', 'week', 'month', 'year'] as const;
export type Unit = (typeof UNITS)[number];
const SHOWS = ['all', 'paid', 'failed', 'pending', 'test'] as const;
type Show = (typeof SHOWS)[number];
const PAGE_SIZES = [10, 20, 30, 40] as const;
export const PRODUCTS = ['Store pass, 1 day', 'Store pass, 1 week', 'Store pass, 1 month', 'Boost'] as const;
const PASS_LABEL = { day: PRODUCTS[0], week: PRODUCTS[1], month: PRODUCTS[2] } as const;

const notFinance = 'Only Finance can see this.';

/** A moment as Harare's wall clock, read with the UTC getters. */
const local = (at: Date) => new Date(at.getTime() + HARARE);
/** The instant Harare's wall clock shows this UTC reading. */
const instant = (wall: number) => new Date(wall - HARARE);

/** The period's key holding this moment: "2026-11-02" (a day, or the
    Monday a week starts), "2026-10", "2026". */
export function keyOf(unit: Unit, at: Date): string {
  const d = local(at);
  if (unit === 'year') return String(d.getUTCFullYear());
  if (unit === 'month') return d.toISOString().slice(0, 7);
  if (unit === 'day') return d.toISOString().slice(0, 10);
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
  return monday.toISOString().slice(0, 10);
}

/** Where a period starts and ends, as instants. */
export function bounds(unit: Unit, key: string): [Date, Date] {
  if (unit === 'year') {
    const y = Number(key);
    return [instant(Date.UTC(y, 0, 1)), instant(Date.UTC(y + 1, 0, 1))];
  }
  if (unit === 'month') {
    const [y, m] = key.split('-').map(Number) as [number, number];
    return [instant(Date.UTC(y, m - 1, 1)), instant(Date.UTC(y, m, 1))];
  }
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const start = Date.UTC(y, m - 1, d);
  return [instant(start), instant(start + (unit === 'day' ? 1 : 7) * DAY)];
}

/** The period before. */
export function previousKey(unit: Unit, key: string): string {
  const [start] = bounds(unit, key);
  return keyOf(unit, new Date(start.getTime() - 1));
}

/** "Oct 2026", "2026", "27 Oct to 2 Nov". */
export function labelOf(unit: Unit, key: string): string {
  if (unit === 'year') return key;
  if (unit === 'month') return `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`;
  const [start, end] = bounds(unit, key);
  if (unit === 'day') {
    const a = local(start);
    return `${WEEKDAYS[(a.getUTCDay() + 6) % 7]} ${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} ${a.getUTCFullYear()}`;
  }
  const a = local(start);
  const b = local(new Date(end.getTime() - 1));
  return `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} to ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]}`;
}

/** The buckets a period's chart has, labelled: hours of a day, days of a
    week or month, months of a year. */
export function bucketsOf(unit: Unit, key: string): string[] {
  if (unit === 'year') return [...MONTHS];
  if (unit === 'day') return Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
  if (unit === 'week') {
    const [start] = bounds(unit, key);
    return WEEKDAYS.map((day, n) => `${day} ${local(new Date(start.getTime() + n * DAY)).getUTCDate()}`);
  }
  const [start, end] = bounds(unit, key);
  const days = Math.round((end.getTime() - start.getTime()) / DAY);
  return Array.from({ length: days }, (_, n) => String(n + 1));
}

/** Which bucket of its period a moment falls in. */
export function bucketOf(unit: Unit, key: string, at: Date): number {
  const [start] = bounds(unit, key);
  if (unit === 'year') return local(at).getUTCMonth();
  if (unit === 'day') return Math.floor((at.getTime() - start.getTime()) / (60 * 60_000));
  return Math.floor((at.getTime() - start.getTime()) / DAY);
}

/** "30 Oct, 14:05", in Harare's time. */
function atLabel(at: Date): string {
  const d = local(at);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hh}:${mm}`;
}

const errors = {
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not in Finance', content: { 'application/json': { schema: ErrorSchema } } },
};

const RowSchema = z
  .object({
    id: z.string(),
    atLabel: z.string(),
    payer: z.string(),
    store: z.string().optional(),
    product: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.enum(['pending', 'paid', 'failed', 'cancelled']),
    /** A test payment, made while Paynow is not set up. */
    test: z.boolean(),
    /** Paynow's reference, once there is one. */
    reference: z.string().optional(),
  })
  .openapi('RevenueRow');
type Row = z.infer<typeof RowSchema> & { at: Date };

/** Payments from `from` to `to`, newest first. */
async function rowsBetween(from: Date, to: Date): Promise<Row[]> {
  const rows = await db
    .select({ payment: t.payments, payer: t.people.displayName, store: t.stores.name, pass: t.storePasses.kind })
    .from(t.payments)
    .innerJoin(t.people, eq(t.people.id, t.payments.personId))
    .leftJoin(t.stores, eq(t.stores.id, t.payments.storeId))
    .leftJoin(t.storePasses, eq(t.storePasses.paymentId, t.payments.id))
    .where(and(gte(t.payments.createdAt, from), lt(t.payments.createdAt, to)))
    .orderBy(desc(t.payments.createdAt));
  return rows.map(({ payment, payer, store, pass }) => ({
    id: payment.id,
    at: payment.createdAt,
    atLabel: atLabel(payment.createdAt),
    payer: payer || 'No name yet',
    store: store ?? undefined,
    product: payment.purpose === 'boost' ? 'Boost' : pass ? PASS_LABEL[pass] : PRODUCTS[0],
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    test: payment.provider === 'test',
    reference: payment.providerRef ?? undefined,
  }));
}

const out = ({ at: _at, ...row }: Row) => row;

const TotalsSchema = z.object({ revenue: z.number(), paid: z.number(), failed: z.number(), pending: z.number() });

const read = createRoute({
  method: 'get',
  path: '/staff/revenue',
  tags: ['Staff'],
  summary: 'Revenue for a week, month or year',
  description:
    'Finance: a period\'s totals, revenue in buckets for its chart (days, or months for a year), revenue by product, each beside the period before, and its payments, newest first, narrowed by `show`. Test payments count only with `test=1`; by default they do while no real payment has been made.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    query: z.object({
      unit: z.enum(UNITS).default('month'),
      period: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/).optional(),
      /** The period to compare with; the one before when not given. */
      against: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/).optional(),
      test: z.enum(['0', '1']).optional(),
      show: z.enum(SHOWS).default('all'),
      page: z.coerce.number().int().min(1).default(1),
      size: z.coerce
        .number()
        .int()
        .refine((n) => (PAGE_SIZES as readonly number[]).includes(n), 'Show 10, 20, 30 or 40 a page')
        .default(10),
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
            /** The period it is compared with, and its name. */
            against: z.string(),
            previousLabel: z.string(),
            periods: z.array(z.object({ value: z.string(), label: z.string() })),
            /** Test payments are counted in the figures. */
            includeTest: z.boolean(),
            /** A real payment has been made, ever. */
            hasReal: z.boolean(),
            totals: z.object({ current: TotalsSchema, previous: TotalsSchema }),
            chart: z.object({ labels: z.array(z.string()), current: z.array(z.number()), previous: z.array(z.number()) }),
            byProduct: z.array(
              z.object({ product: z.string(), revenue: z.number(), previous: z.number(), count: z.number() }),
            ),
            counts: z.record(z.enum(SHOWS), z.number()),
            rows: z.array(RowSchema),
            total: z.number(),
            /** May download the period: a Finance leader. */
            canExport: z.boolean(),
          }),
        },
      },
    },
    ...errors,
  },
});

revenueRoutes.openapi(read, async (c) => {
  const query = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'finance'))) return c.json({ error: notFinance }, 403);

  const unit = query.unit;
  const now = new Date();
  const valid = (key: string | undefined) => key !== undefined && keyOf(unit, bounds(unit, key)[0]) === key;
  const period = valid(query.period) ? query.period! : keyOf(unit, now);
  const before = valid(query.against) && query.against !== period ? query.against! : previousKey(unit, period);
  const [start, end] = bounds(unit, period);
  const [prevStart, prevEnd] = bounds(unit, before);

  const [rows, previousRows, firstRow, realRow, canExport] = await Promise.all([
    rowsBetween(start, end),
    rowsBetween(prevStart, prevEnd),
    db.select({ at: t.payments.createdAt }).from(t.payments).orderBy(asc(t.payments.createdAt)).limit(1),
    db.select({ id: t.payments.id }).from(t.payments).where(ne(t.payments.provider, 'test')).limit(1),
    inDepartment(viewer, 'finance', true),
  ]);
  const hasReal = realRow.length > 0;
  const includeTest = query.test ? query.test === '1' : !hasReal;
  const counted = (row: Row) => (includeTest || !row.test) && row.status === 'paid';

  const current = rows;
  const previous = previousRows;
  const totalsOf = (list: Row[]) => ({
    revenue: list.filter(counted).reduce((sum, row) => sum + row.amount, 0),
    paid: list.filter(counted).length,
    failed: list.filter((row) => (includeTest || !row.test) && row.status === 'failed').length,
    pending: list.filter((row) => (includeTest || !row.test) && row.status === 'pending').length,
  });

  // The chart: each bucket's revenue, this period and the one before.
  const labels = bucketsOf(unit, period);
  const sums = (list: Row[], key: string, size: number) => {
    const out = Array.from({ length: size }, () => 0);
    for (const row of list.filter(counted)) {
      const n = bucketOf(unit, key, row.at);
      if (n >= 0 && n < size) out[n] = (out[n] ?? 0) + row.amount;
    }
    return out;
  };

  // The periods to choose from: from the first payment, or now, to now.
  const periods: { value: string; label: string }[] = [];
  const earliest = firstRow[0]?.at ?? now;
  const most = { day: 92, week: 104, month: 48, year: 10 }[unit];
  for (let key = keyOf(unit, now); periods.length < most; key = previousKey(unit, key)) {
    periods.push({ value: key, label: labelOf(unit, key) });
    if (bounds(unit, key)[0] <= earliest) break;
  }

  const keep: Record<Show, (row: Row) => boolean> = {
    all: () => true,
    paid: (row) => !row.test && row.status === 'paid',
    failed: (row) => !row.test && row.status === 'failed',
    pending: (row) => !row.test && row.status === 'pending',
    test: (row) => row.test,
  };
  const counts = Object.fromEntries(SHOWS.map((each) => [each, current.filter(keep[each]).length])) as Record<Show, number>;
  const shown = current.filter(keep[query.show]);

  return c.json(
    {
      unit,
      period,
      label: labelOf(unit, period),
      against: before,
      previousLabel: labelOf(unit, before),
      periods,
      includeTest,
      hasReal,
      totals: { current: totalsOf(current), previous: totalsOf(previous) },
      chart: {
        labels,
        current: sums(current, period, labels.length),
        previous: sums(previous, before, labels.length),
      },
      byProduct: PRODUCTS.map((product) => ({
        product,
        revenue: current.filter((row) => row.product === product && counted(row)).reduce((sum, row) => sum + row.amount, 0),
        previous: previous.filter((row) => row.product === product && counted(row)).reduce((sum, row) => sum + row.amount, 0),
        count: current.filter((row) => row.product === product && counted(row)).length,
      })),
      counts,
      rows: shown.slice((query.page - 1) * query.size, query.page * query.size).map(out),
      total: shown.length,
      canExport,
    },
    200,
  );
});

const exportPeriod = createRoute({
  method: 'get',
  path: '/staff/revenue/export',
  tags: ['Staff'],
  summary: 'Download a period\'s payments',
  description: 'Finance leaders: every payment in a week, month or year, for the accounts. Each download is logged.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    query: z.object({ unit: z.enum(UNITS), period: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/) }),
  },
  responses: {
    200: { description: 'The payments', content: { 'application/json': { schema: z.object({ rows: z.array(RowSchema) }) } } },
    ...errors,
  },
});

revenueRoutes.openapi(exportPeriod, async (c) => {
  const { unit, period } = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'finance', true))) {
    return c.json({ error: 'Only a Finance leader can download the payments.' }, 403);
  }
  const [start, end] = bounds(unit, period);
  const rows = await rowsBetween(start, end);
  await db
    .insert(t.staffLog)
    .values({ actorId: viewer.id, action: 'revenue.export', detail: { period: labelOf(unit, period), rows: rows.length } });
  return c.json({ rows: rows.map(out) }, 200);
});
