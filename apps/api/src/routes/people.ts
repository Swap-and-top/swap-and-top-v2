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
import { and, asc, count, desc, eq, ilike, inArray, isNull, like, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { localPhone } from '../contact';
import { db } from '../db/client';
import * as t from '../db/schema';
import { actionText, actorOf, applyAction, dayMonth, mayActOn, mayBan, targetsOf } from '../moderation';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { confirmedDealsOf } from './deals';
import { personFor } from './me';
import { notify } from './notifications';

export const peopleRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const reason = z.enum(t.reportReason.enumValues);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthYear = (at: Date) => `${MONTHS[at.getMonth()]} ${at.getFullYear()}`;

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'Not there', content: { 'application/json': { schema: ErrorSchema } } },
};

const notTrustSafety = 'Only Trust and safety can look up people.';

/* --- finding someone ----------------------------------------------------------- */

const FoundSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    /** "077 123 4567" */
    phone: z.string().optional(),
    location: z.string().optional(),
    standing: z.string(),
  })
  .openapi('FoundPerson');

const find = createRoute({
  method: 'get',
  path: '/staff/people',
  tags: ['Staff'],
  summary: 'Find a person',
  description: 'Trust and safety. Up to 20 people whose name or phone number matches.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { query: z.object({ q: z.string().trim().min(2) }) },
  responses: {
    200: { description: 'Matches', content: { 'application/json': { schema: z.object({ people: z.array(FoundSchema) }) } } },
    ...errors,
  },
});

peopleRoutes.openapi(find, async (c) => {
  const { q } = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: notTrustSafety }, 403);
  // A number as people write it, "077 123", searched as stored, "+26377123".
  const digits = q.replace(/\D/g, '');
  const phone = digits.length >= 3 ? `%${digits.startsWith('0') ? `263${digits.slice(1)}` : digits}%` : null;
  const rows = await db
    .select({
      id: t.people.id,
      name: t.people.displayName,
      phone: t.people.phone,
      location: t.people.location,
      standing: t.people.standing,
    })
    .from(t.people)
    .where(or(ilike(t.people.displayName, `%${q}%`), phone ? like(t.people.phone, phone) : undefined))
    .orderBy(asc(t.people.displayName))
    .limit(20);
  return c.json(
    {
      people: rows.map((row) => ({
        id: row.id,
        name: row.name || 'No name yet',
        phone: row.phone ? localPhone(row.phone) : undefined,
        location: row.location ?? undefined,
        standing: row.standing,
      })),
    },
    200,
  );
});

/* --- their record ---------------------------------------------------------------- */

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
    /** "Lead" or "Member" on our team; "Super admin". */
    teamLabel: z.string().optional(),
    stores: z.array(z.object({ name: z.string(), slug: z.string(), role: z.string() })),
    confirmedDeals: z.number(),
    liveListings: z.number(),
    listings: z.array(z.object({ title: z.string(), slug: z.string(), status: z.string(), dateLabel: z.string() })),
    reports: z.array(
      z.object({
        reason,
        state: z.string(),
        dateLabel: z.string(),
        listingTitle: z.string().optional(),
        /** Why it was decided so, once it was. */
        note: z.string().optional(),
      }),
    ),
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
  path: '/staff/people/{id}',
  tags: ['Staff'],
  summary: 'A person’s record',
  description: 'Trust and safety. Their listings, stores, deals, reports about them and actions taken. Each look is logged.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Their record', content: { 'application/json': { schema: RecordSchema } } },
    ...errors,
  },
});

peopleRoutes.openapi(record, async (c) => {
  const { id } = c.req.valid('param');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: notTrustSafety }, 403);
  const [person] = await db.select().from(t.people).where(eq(t.people.id, id));
  if (!person) return c.json({ error: 'That person is not there.' }, 404);

  const [actor, targets, stores, deals, live, listings, reports, actions] = await Promise.all([
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
      .select({ title: t.listings.title, slug: t.listings.slug, status: t.listings.status, at: t.listings.createdAt })
      .from(t.listings)
      .where(eq(t.listings.ownerId, id))
      .orderBy(desc(t.listings.createdAt))
      .limit(10),
    db
      .select({
        reason: t.reports.reason,
        state: t.reports.state,
        at: t.reports.createdAt,
        listingTitle: t.listings.title,
        note: t.moderationActions.note,
      })
      .from(t.reports)
      .leftJoin(t.listings, eq(t.listings.id, t.reports.listingId))
      // The decision on it, for its note.
      .leftJoin(t.moderationActions, eq(t.moderationActions.reportId, t.reports.id))
      .where(eq(t.reports.personId, id))
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
  await db.insert(t.staffLog).values({ actorId: viewer.id, action: 'person.view', targetPersonId: id, detail: {} });

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
        person.role === 'super_admin' ? 'Super admin' : target?.rank === 'lead' ? 'Lead' : target?.rank === 'member' ? 'Member' : undefined,
      stores,
      confirmedDeals: deals,
      liveListings: live[0]?.n ?? 0,
      listings: listings.map((row) => ({ title: row.title, slug: row.slug, status: row.status, dateLabel: dayMonth(row.at) })),
      reports: reports.map((row) => ({
        reason: row.reason,
        state: row.state,
        dateLabel: dayMonth(row.at),
        listingTitle: row.listingTitle ?? undefined,
        note: row.note ?? undefined,
      })),
      actions: actions.map(({ action, byName }) => ({
        kind: action.kind,
        reason: action.reason,
        note: action.note ?? undefined,
        byName: byName || 'Someone',
        dateLabel: dayMonth(action.createdAt),
        reversed: action.reversedAt !== null,
        fromReport: action.reportId !== null,
      })),
      cannotAct: mayActOn(actor, target) ?? undefined,
      canBan: mayBan(actor),
    },
    200,
  );
});

/* --- acting on them ------------------------------------------------------------------ */

const act = createRoute({
  method: 'post',
  path: '/staff/people/{id}/action',
  tags: ['Staff'],
  summary: 'Warn, suspend or ban a person',
  description:
    'Trust and safety, on someone they may act on. A warning, a 7 day suspension, or a ban (Trust and safety leads only), under a reason and with a note saying why. They are told what was decided.',
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

peopleRoutes.openapi(act, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: notTrustSafety }, 403);
  const [actor, targets] = await Promise.all([actorOf(viewer), targetsOf([id])]);
  const target = targets.get(id);
  const why = mayActOn(actor, target);
  if (why) return c.json({ error: why }, target ? 403 : 404);
  if (body.kind === 'ban' && !mayBan(actor)) return c.json({ error: 'Only a Trust and safety lead can ban an account.' }, 403);
  if (body.kind === 'ban' && target!.standing === 'banned') return c.json({ error: 'This account is banned already.' }, 400);

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
