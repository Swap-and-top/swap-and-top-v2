/**
 * Stores, the Sales section of the Staff console (docs/product/staff-
 * console.md): every open store with its owner, how many listings it has
 * live and how its pass stands (`show=stores`, the All stores tab); and
 * those worth calling (`show=call`, the Stores to call tab): stores near the
 * free limit, passes ending soon or lapsed, and users close to the limit of
 * 5 who have no store yet, the likeliest to want one.
 *
 * A number is shown one at a time, on asking
 * (`GET /staff/sales/phone/{personId}`), and each look is logged: for
 * calling, not copying.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { localPhone } from '../contact';
import { coveredUntil, dayMonth, FREE_STORE_LIMIT } from '../passes';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { personFor } from './me';

export const salesRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

/** How close to a limit counts as near it: three listings short for a
    store, one for a user. */
const NEAR_STORE = FREE_STORE_LIMIT - 3;
const USER_LIMIT = 5;
const NEAR_USER = USER_LIMIT - 1;
/** How soon a pass ending counts as ending soon. */
const ENDING_DAYS = 3;

const SHOWS = ['stores', 'free', 'paid', 'verified', 'call', 'near', 'ending', 'lapsed', 'users'] as const;
type Show = (typeof SHOWS)[number];
const PAGE_SIZES = [10, 20, 30, 40] as const;

const notSales = 'Only Sales can see this.';

const errors = {
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not in Sales', content: { 'application/json': { schema: ErrorSchema } } },
};

const RowSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['store', 'user']),
    /** The store's name, or the user's. */
    name: z.string(),
    /** Whose number to call. */
    ownerId: z.string(),
    ownerName: z.string(),
    area: z.string(),
    /** Live listings for sale or swap. */
    live: z.number(),
    /** The most it can have live; none with a pass. */
    limit: z.number().optional(),
    /** How its pass stands; `none` for a user with no store. */
    state: z.enum(['free', 'paid', 'ending', 'lapsed', 'none']),
    /** "25 Nov", while a pass runs. */
    paidUntilLabel: z.string().optional(),
    verified: z.boolean(),
  })
  .openapi('SalesRow');
type Row = z.infer<typeof RowSchema>;

const list = createRoute({
  method: 'get',
  path: '/staff/sales',
  tags: ['Staff'],
  summary: 'Stores, and who to call',
  description:
    'Sales: every open store with its owner, listings and pass (`show=stores`), or those worth calling (`show=call`: near the free limit, pass ending soon or lapsed, and users near the limit of 5 with no store), narrowed further by the other values of `show`; `q` searches names; `counts` says how many each holds. No phone numbers here.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    query: z.object({
      q: z.string().trim().max(60).optional(),
      show: z.enum(SHOWS).default('stores'),
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
      description: 'The rows',
      content: {
        'application/json': {
          schema: z.object({ rows: z.array(RowSchema), total: z.number(), counts: z.record(z.enum(SHOWS), z.number()) }),
        },
      },
    },
    ...errors,
  },
});

salesRoutes.openapi(list, async (c) => {
  const { q, show, page, size } = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'sales'))) return c.json({ error: notSales }, 403);

  const now = new Date();
  const [stores, passes, storeLive, personLive, memberships] = await Promise.all([
    db
      .select({
        id: t.stores.id,
        name: t.stores.name,
        location: t.stores.location,
        verifiedAt: t.stores.verifiedAt,
        ownerId: t.people.id,
        ownerName: t.people.displayName,
      })
      .from(t.stores)
      .innerJoin(
        t.storeMembers,
        and(eq(t.storeMembers.storeId, t.stores.id), eq(t.storeMembers.role, 'owner'), isNull(t.storeMembers.removedAt)),
      )
      .innerJoin(t.people, eq(t.people.id, t.storeMembers.personId))
      .where(isNull(t.stores.closedAt)),
    db
      .select({ storeId: t.storePasses.storeId, startsAt: t.storePasses.startsAt, endsAt: t.storePasses.endsAt })
      .from(t.storePasses)
      .orderBy(asc(t.storePasses.startsAt)),
    db
      .select({ storeId: t.listings.storeId, n: count() })
      .from(t.listings)
      .where(and(eq(t.listings.status, 'live'), inArray(t.listings.type, ['sale', 'swap'])))
      .groupBy(t.listings.storeId),
    db
      .select({ personId: t.listings.ownerId, n: count() })
      .from(t.listings)
      .where(and(eq(t.listings.status, 'live'), inArray(t.listings.type, ['sale', 'swap']), isNull(t.listings.storeId)))
      .groupBy(t.listings.ownerId),
    db
      .select({ personId: t.storeMembers.personId })
      .from(t.storeMembers)
      .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
      .where(and(isNull(t.storeMembers.removedAt), isNull(t.stores.closedAt))),
  ]);

  const liveOf = new Map(storeLive.map((row) => [row.storeId, row.n]));
  const rows: Row[] = stores.map((store) => {
    const theirs = passes.filter((pass) => pass.storeId === store.id);
    const until = coveredUntil(theirs, now);
    const ending = until !== null && until.getTime() - now.getTime() <= ENDING_DAYS * 24 * 60 * 60_000;
    return {
      id: store.id,
      kind: 'store',
      name: store.name,
      ownerId: store.ownerId,
      ownerName: store.ownerName || 'No name yet',
      area: store.location,
      live: liveOf.get(store.id) ?? 0,
      limit: until ? undefined : FREE_STORE_LIMIT,
      state: until ? (ending ? 'ending' : 'paid') : theirs.length ? 'lapsed' : 'free',
      paidUntilLabel: until ? dayMonth(until) : undefined,
      verified: store.verifiedAt !== null,
    };
  });

  // Users near the limit, with no store of their own or to work for.
  const inStores = new Set(memberships.map((row) => row.personId));
  const nearIds = personLive.filter((row) => row.n >= NEAR_USER && !inStores.has(row.personId));
  if (nearIds.length) {
    const people = await db
      .select({ id: t.people.id, name: t.people.displayName, location: t.people.location })
      .from(t.people)
      .where(and(inArray(t.people.id, nearIds.map((row) => row.personId)), isNull(t.people.deletedAt)));
    for (const person of people) {
      rows.push({
        id: person.id,
        kind: 'user',
        name: person.name || 'No name yet',
        ownerId: person.id,
        ownerName: person.name || 'No name yet',
        area: person.location ?? '',
        live: nearIds.find((row) => row.personId === person.id)?.n ?? 0,
        limit: USER_LIMIT,
        state: 'none',
        verified: false,
      });
    }
  }

  const isNear = (row: Row) => row.kind === 'store' && row.limit !== undefined && row.live >= NEAR_STORE;
  const toCall = (row: Row) => isNear(row) || row.state === 'ending' || row.state === 'lapsed' || row.kind === 'user';
  const test: Record<Show, (row: Row) => boolean> = {
    stores: (row) => row.kind === 'store',
    call: toCall,
    near: isNear,
    users: (row) => row.kind === 'user',
    free: (row) => row.state === 'free',
    paid: (row) => row.state === 'paid' || row.state === 'ending',
    ending: (row) => row.state === 'ending',
    lapsed: (row) => row.state === 'lapsed',
    verified: (row) => row.verified,
  };
  const needle = q?.toLowerCase();
  const searched = needle
    ? rows.filter((row) => `${row.name} ${row.ownerName} ${row.area}`.toLowerCase().includes(needle))
    : rows;
  const counts = Object.fromEntries(SHOWS.map((each) => [each, searched.filter(test[each]).length])) as Record<Show, number>;
  // The fullest first: the closest to needing a pass.
  const found = searched
    .filter(test[show])
    .sort((a, b) => b.live - a.live || a.name.localeCompare(b.name));
  return c.json({ rows: found.slice((page - 1) * size, page * size), total: found.length, counts }, 200);
});

const phone = createRoute({
  method: 'get',
  path: '/staff/sales/phone/{personId}',
  tags: ['Staff'],
  summary: 'An owner\'s number, to call them',
  description: 'Sales: one number at a time, and each look is logged.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ personId: z.string() }) },
  responses: {
    200: {
      description: 'Their number',
      content: { 'application/json': { schema: z.object({ phone: z.string().optional() }) } },
    },
    ...errors,
    404: { description: 'No such user', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

salesRoutes.openapi(phone, async (c) => {
  const { personId } = c.req.valid('param');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'sales'))) return c.json({ error: notSales }, 403);
  const [person] = await db
    .select({ phone: t.people.phone, deletedAt: t.people.deletedAt })
    .from(t.people)
    .where(eq(t.people.id, personId));
  if (!person || person.deletedAt) return c.json({ error: 'That user is not there any more.' }, 404);
  await db.insert(t.staffLog).values({ actorId: viewer.id, action: 'sales.phone', targetPersonId: personId, detail: {} });
  return c.json({ phone: person.phone ? localPhone(person.phone) : undefined }, 200);
});
