/**
 * People, in the Staff console (docs/product/staff-console.md, Trust and
 * safety): find anyone by name or number, open their record (their
 * listings, stores, confirmed deals, reports about them and actions taken),
 * and warn or suspend them, or ban them as a lead, without a report. Every
 * record opened is a `person.view` row in `staff_log`, as every action is
 * (`person.warning`, `person.suspension`, `person.ban`). Who may act on whom
 * is in ../moderation.ts, the same as for reports.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, like, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { localPhone } from '../contact';
import { db } from '../db/client';
import * as t from '../db/schema';
import { actionText, actorOf, applyAction, dayMonth, mayActOn, mayBan, targetsOf } from '../moderation';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { confirmedDealsOf } from './deals';
import { personFor } from './me';
import { photosOf, reportLabel } from './reports';
import { notify } from './notifications';

export const userRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const reason = z.enum(t.reportReason.enumValues);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthYear = (at: Date) => `${MONTHS[at.getMonth()]} ${at.getFullYear()}`;

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'Not there', content: { 'application/json': { schema: ErrorSchema } } },
};

const notTrustSafety = 'Only Trust and safety can look up users.';

/* --- everyone, or someone ---------------------------------------------------------- */

/** What the list can show: everyone, one standing, or our own team. */
const SHOWS = ['all', 'good', 'warned', 'suspended', 'banned', 'team'] as const;
type Show = (typeof SHOWS)[number];
const PAGE_SIZES = [10, 20, 30, 40] as const;
/** A look at a record is logged once in this long, per person looking. */
const LOOK_MS = 10 * 60_000;

const FoundSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    /** "077 123 4567" */
    phone: z.string().optional(),
    location: z.string().optional(),
    standing: z.string(),
    /** "Sep 2026" */
    joinedLabel: z.string(),
    liveListings: z.number(),
    /** Reports about them, ever. */
    reports: z.number(),
    /** "Dpt. leader" (department leader, kept short for the pill) or "Member" on our team; "Super admin". */
    teamLabel: z.string().optional(),
  })
  .openapi('FoundPerson');

const find = createRoute({
  method: 'get',
  path: '/staff/users',
  tags: ['Staff'],
  summary: 'Every user, or one',
  description:
    'Trust and safety. Everyone, newest first, 10, 20, 30 or 40 a page (`size`, `page` from 1), with how many there are. `q` finds a name or a phone number; `show` narrows it to one standing or to our own team, and `counts` says how many each would show.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    query: z.object({
      q: z.string().trim().max(60).optional(),
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
      description: 'The users',
      content: {
        'application/json': {
          schema: z.object({
            people: z.array(FoundSchema),
            total: z.number(),
            counts: z.object(Object.fromEntries(SHOWS.map((show) => [show, z.number()])) as Record<Show, z.ZodNumber>),
          }),
        },
      },
    },
    ...errors,
  },
});

userRoutes.openapi(find, async (c) => {
  const { q, show, page, size } = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: notTrustSafety }, 403);

  // A name, or a number as people write it, "077 123", searched as stored,
  // "+26377123".
  const digits = q?.replace(/\D/g, '') ?? '';
  const phone = digits.length >= 3 ? `%${digits.startsWith('0') ? `263${digits.slice(1)}` : digits}%` : null;
  const search = q ? or(ilike(t.people.displayName, `%${q}%`), phone ? like(t.people.phone, phone) : undefined) : undefined;
  /** On our own team: in a department, or the super admin. */
  const onTeam = or(
    eq(t.people.role, 'super_admin'),
    inArray(t.people.id, db.select({ id: t.staffDepartments.personId }).from(t.staffDepartments)),
  );
  const narrowed: Record<Show, ReturnType<typeof and>> = {
    all: undefined,
    good: eq(t.people.standing, 'good'),
    warned: inArray(t.people.standing, ['warned', 'limited']),
    suspended: eq(t.people.standing, 'suspended'),
    banned: eq(t.people.standing, 'banned'),
    team: onTeam,
  };

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: t.people.id,
        name: t.people.displayName,
        phone: t.people.phone,
        location: t.people.location,
        standing: t.people.standing,
        joinedAt: t.people.joinedAt,
      })
      .from(t.people)
      .where(and(search, narrowed[show]))
      .orderBy(desc(t.people.joinedAt), asc(t.people.id))
      .limit(size)
      .offset((page - 1) * size),
    Promise.all(
      SHOWS.map((each) =>
        db
          .select({ n: count() })
          .from(t.people)
          .where(and(search, narrowed[each]))
          .then(([row]) => [each, row?.n ?? 0] as const),
      ),
    ),
  ]);
  const ids = rows.map((row) => row.id);
  const [live, reported, targets] = ids.length
    ? await Promise.all([
        db
          .select({ id: t.listings.ownerId, n: count() })
          .from(t.listings)
          .where(and(inArray(t.listings.ownerId, ids), eq(t.listings.status, 'live')))
          .groupBy(t.listings.ownerId),
        db
          .select({ id: t.reports.personId, n: count() })
          .from(t.reports)
          .where(inArray(t.reports.personId, ids))
          .groupBy(t.reports.personId),
        targetsOf(ids),
      ])
    : [[], [], new Map()];
  const liveOf = new Map(live.map((row) => [row.id, row.n]));
  const reportsOf = new Map(reported.map((row) => [row.id, row.n]));
  const counts = Object.fromEntries(totals) as Record<Show, number>;

  return c.json(
    {
      people: rows.map((row) => {
        const target = targets.get(row.id);
        return {
          id: row.id,
          name: row.name || 'No name yet',
          phone: row.phone ? localPhone(row.phone) : undefined,
          location: row.location ?? undefined,
          standing: row.standing,
          joinedLabel: monthYear(row.joinedAt),
          liveListings: liveOf.get(row.id) ?? 0,
          reports: reportsOf.get(row.id) ?? 0,
          teamLabel:
            target?.role === 'super_admin'
              ? 'Super admin'
              : target?.rank === 'lead'
                ? 'Dpt. leader'
                : target?.rank === 'member'
                  ? 'Member'
                  : undefined,
        };
      }),
      total: counts[show],
      counts,
    },
    200,
  );
});

/* --- their record ---------------------------------------------------------------- */

/** A report on the record: about them, or sent by them. */
const ReportLineSchema = z.object({
  id: z.string(),
  /** "REP 2026 0014" */
  label: z.string(),
  reason,
  state: z.string(),
  /** What was decided: none (cleared), warning, removal, suspension, ban. */
  kind: z.string().optional(),
  dateLabel: z.string(),
  listingTitle: z.string().optional(),
  /** For a report they sent: who it was about. */
  personName: z.string().optional(),
  /** Why it was decided so, once it was. */
  note: z.string().optional(),
  /** The decision was overturned on appeal. */
  reversed: z.boolean(),
});

const RecordSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    phone: z.string().optional(),
    location: z.string().optional(),
    /** "Aug 2026" */
    joinedLabel: z.string(),
    /** "28 Oct" */
    lastSeenLabel: z.string().optional(),
    standing: z.string(),
    /** "4 Nov", while suspended. */
    suspendedUntilLabel: z.string().optional(),
    /** "Dpt. leader" (department leader, kept short for the pill) or "Member" on our team; "Super admin". */
    teamLabel: z.string().optional(),
    stores: z.array(z.object({ name: z.string(), slug: z.string(), role: z.string() })),
    confirmedDeals: z.number(),
    liveListings: z.number(),
    listings: z.array(
      z.object({ title: z.string(), slug: z.string(), status: z.string(), dateLabel: z.string(), photo: z.string().optional() }),
    ),
    reports: z.array(ReportLineSchema),
    /** Reports this person sent about others: a sign of one who reports
        falsely, or often. */
    reportsSent: z.array(ReportLineSchema),
    actions: z.array(
      z.object({
        kind: z.string(),
        reason,
        note: z.string().optional(),
        byName: z.string(),
        dateLabel: z.string(),
        reversed: z.boolean(),
        fromReport: z.boolean(),
      }),
    ),
    /** Why this viewer may not act on them; none when they may. */
    cannotAct: z.string().optional(),
    canBan: z.boolean(),
  })
  .openapi('PersonRecord');

const record = createRoute({
  method: 'get',
  path: '/staff/users/{id}',
  tags: ['Staff'],
  summary: 'A user’s record',
  description: 'Trust and safety. Their listings, stores, deals, reports about them and actions taken. Each look is logged.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Their record', content: { 'application/json': { schema: RecordSchema } } },
    ...errors,
  },
});

userRoutes.openapi(record, async (c) => {
  const { id } = c.req.valid('param');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: notTrustSafety }, 403);
  const [person] = await db.select().from(t.people).where(eq(t.people.id, id));
  if (!person) return c.json({ error: 'That user is not there.' }, 404);

  const about = alias(t.people, 'about');
  const reportLine = {
    id: t.reports.id,
    number: t.reports.number,
    createdAt: t.reports.createdAt,
    reason: t.reports.reason,
    state: t.reports.state,
    listingTitle: t.listings.title,
    kind: t.moderationActions.kind,
    note: t.moderationActions.note,
    reversedAt: t.moderationActions.reversedAt,
  };
  const [actor, targets, stores, deals, live, listings, reports, sent, actions] = await Promise.all([
    actorOf(viewer),
    targetsOf([id]),
    db
      .select({ name: t.stores.name, slug: t.stores.slug, role: t.storeMembers.role })
      .from(t.storeMembers)
      .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
      .where(and(eq(t.storeMembers.personId, id), isNull(t.storeMembers.removedAt), isNull(t.stores.closedAt))),
    confirmedDealsOf(id),
    db
      .select({ n: count() })
      .from(t.listings)
      .where(and(eq(t.listings.ownerId, id), eq(t.listings.status, 'live'))),
    db
      .select({ id: t.listings.id, title: t.listings.title, slug: t.listings.slug, status: t.listings.status, at: t.listings.createdAt })
      .from(t.listings)
      .where(eq(t.listings.ownerId, id))
      .orderBy(desc(t.listings.createdAt))
      .limit(10),
    db
      .select(reportLine)
      .from(t.reports)
      .leftJoin(t.listings, eq(t.listings.id, t.reports.listingId))
      // The decision on it, for what was done and its note.
      .leftJoin(t.moderationActions, eq(t.moderationActions.reportId, t.reports.id))
      .where(eq(t.reports.personId, id))
      .orderBy(desc(t.reports.createdAt))
      .limit(10),
    db
      .select({ ...reportLine, personName: about.displayName })
      .from(t.reports)
      .innerJoin(about, eq(about.id, t.reports.personId))
      .leftJoin(t.listings, eq(t.listings.id, t.reports.listingId))
      .leftJoin(t.moderationActions, eq(t.moderationActions.reportId, t.reports.id))
      .where(eq(t.reports.reporterId, id))
      .orderBy(desc(t.reports.createdAt))
      .limit(10),
    db
      .select({ action: t.moderationActions, byName: t.people.displayName })
      .from(t.moderationActions)
      .innerJoin(t.people, eq(t.people.id, t.moderationActions.decidedById))
      .where(and(eq(t.moderationActions.personId, id), inArray(t.moderationActions.kind, ['warning', 'removal', 'suspension', 'ban'])))
      .orderBy(desc(t.moderationActions.createdAt))
      .limit(20),
  ]);
  const target = targets.get(id);
  const photos = await photosOf(listings.map((row) => row.id));
  /** A report as the record lists it. */
  const line = (row: (typeof reports)[number] & { personName?: string | null }) => ({
    id: row.id,
    label: reportLabel(row),
    reason: row.reason,
    state: row.state,
    kind: row.kind ?? undefined,
    dateLabel: dayMonth(row.createdAt),
    listingTitle: row.listingTitle ?? undefined,
    personName: row.personName ?? undefined,
    note: row.note ?? undefined,
    reversed: row.reversedAt !== null,
  });
  // Each look is logged, but the record reads itself again as the page is
  // come back to: one look in ten minutes is enough.
  const [lookedLately] = await db
    .select({ id: t.staffLog.id })
    .from(t.staffLog)
    .where(
      and(
        eq(t.staffLog.actorId, viewer.id),
        eq(t.staffLog.action, 'person.view'),
        eq(t.staffLog.targetPersonId, id),
        gte(t.staffLog.createdAt, new Date(Date.now() - LOOK_MS)),
      ),
    )
    .limit(1);
  if (!lookedLately) {
    await db.insert(t.staffLog).values({ actorId: viewer.id, action: 'person.view', targetPersonId: id, detail: {} });
  }

  return c.json(
    {
      id,
      name: person.displayName || 'No name yet',
      phone: person.phone ? localPhone(person.phone) : undefined,
      location: person.location ?? undefined,
      joinedLabel: monthYear(person.joinedAt),
      lastSeenLabel: person.lastSeenAt ? dayMonth(person.lastSeenAt) : undefined,
      standing: person.standing,
      suspendedUntilLabel:
        person.standing === 'suspended' && person.suspendedUntil ? dayMonth(person.suspendedUntil) : undefined,
      teamLabel:
        person.role === 'super_admin' ? 'Super admin' : target?.rank === 'lead' ? 'Dpt. leader' : target?.rank === 'member' ? 'Member' : undefined,
      stores,
      confirmedDeals: deals,
      liveListings: live[0]?.n ?? 0,
      listings: listings.map((row) => ({
        title: row.title,
        slug: row.slug,
        status: row.status,
        dateLabel: dayMonth(row.at),
        photo: photos.get(row.id),
      })),
      reports: reports.map(line),
      reportsSent: sent.map((row) => ({ ...line(row), personName: row.personName || 'No name yet' })),
      actions: actions.map(({ action, byName }) => ({
        kind: action.kind,
        reason: action.reason,
        note: action.note ?? undefined,
        byName: byName || 'Someone',
        dateLabel: dayMonth(action.createdAt),
        reversed: action.reversedAt !== null,
        fromReport: action.reportId !== null,
      })),
      // A ban is lifted only by overturning it on appeal.
      cannotAct:
        person.standing === 'banned'
          ? 'Banned. Only an overturned appeal lifts a ban.'
          : (mayActOn(actor, target) ?? undefined),
      canBan: mayBan(actor),
    },
    200,
  );
});

/* --- acting on them ------------------------------------------------------------------ */

const act = createRoute({
  method: 'post',
  path: '/staff/users/{id}/action',
  tags: ['Staff'],
  summary: 'Warn, suspend or ban a user',
  description:
    'Trust and safety, on someone they may act on. A warning, a 7 day suspension, or a ban (Trust and safety leaders only), under a reason and with a note saying why. They are told what was decided.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            kind: z.enum(['warning', 'suspension', 'ban']),
            reason,
            /** Why: required, so the record shows the thinking. */
            note: z.string({ error: 'Write a short note saying why' }).trim().min(2, 'Write a short note saying why').max(500),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Done', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    ...errors,
  },
});

userRoutes.openapi(act, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: notTrustSafety }, 403);
  const [actor, targets] = await Promise.all([actorOf(viewer), targetsOf([id])]);
  const target = targets.get(id);
  const why = mayActOn(actor, target);
  if (why) return c.json({ error: why }, target ? 403 : 404);
  if (body.kind === 'ban' && !mayBan(actor)) return c.json({ error: 'Only a Trust and safety leader can ban an account.' }, 403);
  // Nothing more to do to a banned account: only an overturned appeal lifts it.
  if (target!.standing === 'banned') return c.json({ error: 'Banned. Only an overturned appeal lifts a ban.' }, 400);

  const now = new Date();
  const { until, actionId } = await db.transaction(async (tx) => {
    const ends = await applyAction(tx, { personId: id, kind: body.kind, now });
    const [made] = await tx
      .insert(t.moderationActions)
      .values({
        personId: id,
        decidedById: viewer.id,
        kind: body.kind,
        reason: body.reason,
        note: body.note,
        until: ends,
      })
      .returning({ id: t.moderationActions.id });
    await tx.insert(t.staffLog).values({
      actorId: viewer.id,
      action: `person.${body.kind}`,
      targetPersonId: id,
      detail: { reason: body.reason, note: body.note },
    });
    return { until: ends, actionId: made!.id };
  });
  // With a link to see it and appeal.
  await notify(id, 'account', actionText(body.kind, body.reason, { until, fromReport: false }), `/appeal/${actionId}`);
  return c.json({ ok: true }, 200);
});
