/**
 * Appeals (docs/features/moderation.md, "Appeals"): a person acted on by
 * our team (a warning, a removed listing, a suspension, a ban) appeals once,
 * in their own words, from the action's page (/appeal/{id}, which their
 * notification links to). A Trust and safety lead other than the one who
 * decided it, and who may act on them (../moderation.ts), upholds it or
 * overturns it, giving a reason either way. Overturning marks the action
 * reversed and undoes it (`undoAction`), keeping the record. The person is
 * told the outcome; each decision is a `staff_log` row (`appeal.uphold`,
 * `appeal.overturn`).
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, asc, desc, eq, isNull, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { actorOf, dayMonth, mayActOn, targetsOf, undoAction } from '../moderation';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { personFor } from './me';

type Person = Awaited<ReturnType<typeof personFor>>;
import { notify } from './notifications';

export const appealRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const reason = z.enum(t.reportReason.enumValues);
const kind = z.enum(['warning', 'removal', 'suspension', 'ban']);

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'Not there', content: { 'application/json': { schema: ErrorSchema } } },
};

function agoLabel(at: Date): string {
  const minutes = Math.floor((Date.now() - at.getTime()) / 60000);
  if (minutes < 60) return minutes < 1 ? 'Just now' : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

/* --- the person's side --------------------------------------------------------- */

const MyActionSchema = z
  .object({
    kind,
    reason,
    /** "29 Oct" */
    dateLabel: z.string(),
    listingTitle: z.string().optional(),
    /** "5 Nov", for a suspension. */
    untilLabel: z.string().optional(),
    /** Overturned, on appeal. */
    reversed: z.boolean(),
    appeal: z
      .object({
        state: z.enum(['waiting', 'upheld', 'overturned']),
        statement: z.string(),
        /** Why it was decided so. */
        reason: z.string().optional(),
      })
      .nullable(),
  })
  .openapi('MyAction');

/** The person's own action, or why they cannot see it. */
async function myAction(personId: string, id: string) {
  const [row] = await db
    .select({ action: t.moderationActions, listingTitle: t.listings.title })
    .from(t.moderationActions)
    .leftJoin(t.listings, eq(t.listings.id, t.moderationActions.listingId))
    .where(and(eq(t.moderationActions.id, id), eq(t.moderationActions.personId, personId), ne(t.moderationActions.kind, 'none')));
  return row;
}

async function myActionOut(personId: string, id: string) {
  const row = await myAction(personId, id);
  if (!row) return null;
  const [appeal] = await db.select().from(t.appeals).where(eq(t.appeals.actionId, id));
  return {
    kind: row.action.kind as z.infer<typeof kind>,
    reason: row.action.reason,
    dateLabel: dayMonth(row.action.createdAt),
    listingTitle: row.listingTitle ?? undefined,
    untilLabel: row.action.kind === 'suspension' && row.action.until ? dayMonth(row.action.until) : undefined,
    reversed: row.action.reversedAt !== null,
    appeal: appeal
      ? {
          state: (appeal.outcome ?? 'waiting') as 'waiting' | 'upheld' | 'overturned',
          statement: appeal.statement,
          reason: appeal.reason ?? undefined,
        }
      : null,
  };
}

const mine = createRoute({
  method: 'get',
  path: '/me/actions/{id}',
  tags: ['Account'],
  summary: 'An action our team took on you',
  description: 'What was decided and why, and your appeal if you made one.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'The action', content: { 'application/json': { schema: MyActionSchema } } },
    401: errors[401],
    404: errors[404],
  },
});

appealRoutes.openapi(mine, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  const out = await myActionOut(person.id, id);
  if (!out) return c.json({ error: 'That is not there.' }, 404);
  return c.json(out, 200);
});

const appeal = createRoute({
  method: 'post',
  path: '/me/actions/{id}/appeal',
  tags: ['Account'],
  summary: 'Appeal an action',
  description: 'Once per action, in your own words. A leader other than the one who decided looks at it.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            statement: z.string().trim().min(10, 'Say a little more about why it was wrong').max(1000),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Sent', content: { 'application/json': { schema: MyActionSchema } } },
    ...errors,
  },
});

appealRoutes.openapi(appeal, async (c) => {
  const { id } = c.req.valid('param');
  const { statement } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const row = await myAction(person.id, id);
  if (!row) return c.json({ error: 'That is not there.' }, 404);
  if (row.action.reversedAt) return c.json({ error: 'This has been overturned already.' }, 400);
  const inserted = await db
    .insert(t.appeals)
    .values({ actionId: id, personId: person.id, statement })
    .onConflictDoNothing()
    .returning({ id: t.appeals.id });
  if (inserted.length === 0) return c.json({ error: 'You have appealed this already.' }, 400);
  return c.json((await myActionOut(person.id, id))!, 201);
});

/* --- the lead's side ------------------------------------------------------------- */

const onlyLeads = 'Only Trust and safety leaders decide appeals.';

/** What the list can be narrowed to: waiting, or how it was decided. */
const SHOW = ['all', 'waiting', 'upheld', 'overturned'] as const;
type Show = (typeof SHOW)[number];

const AppealRowSchema = z
  .object({
    id: z.string(),
    person: z.object({ id: z.string(), name: z.string() }),
    kind,
    reason,
    listingTitle: z.string().optional(),
    /** The note left for the record when the action was decided. */
    note: z.string().optional(),
    decidedBy: z.string(),
    decidedLabel: z.string(),
    fromReport: z.boolean(),
    statement: z.string(),
    /** "3h ago" */
    agoLabel: z.string(),
    /** Waiting for a leader, or how it was decided. */
    state: z.enum(['waiting', 'upheld', 'overturned']),
    /** Once decided: by whom, when ("29 Oct") and why. */
    outcome: z.object({ by: z.string(), dateLabel: z.string(), reason: z.string().optional() }).optional(),
  })
  .openapi('AppealRow');

const waiting = createRoute({
  method: 'get',
  path: '/staff/appeals',
  tags: ['Staff'],
  summary: 'Appeals',
  description:
    'Trust and safety leaders. Every appeal about users this leader may act on: the waiting ones first, oldest first (leaving out appeals against their own decisions), then the decided ones, newest first. `show` narrows it to waiting, upheld or overturned; `counts` says how many each would show.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { query: z.object({ show: z.enum(SHOW).default('all') }) },
  responses: {
    200: {
      description: 'The appeals',
      content: {
        'application/json': {
          schema: z.object({ appeals: z.array(AppealRowSchema), counts: z.record(z.enum(SHOW), z.number()) }),
        },
      },
    },
    401: errors[401],
    403: errors[403],
  },
});

const decider = alias(t.people, 'decider');
const reviewer = alias(t.people, 'reviewer');

/** The appeals waiting for this lead: not their own decisions, and only
    about people they may act on. */
export async function appealsWaitingFor(viewer: Person) {
  const rows = await db
    .select({
      appeal: t.appeals,
      action: t.moderationActions,
      listingTitle: t.listings.title,
      listingStore: t.listings.storeId,
      decidedBy: decider.displayName,
    })
    .from(t.appeals)
    .innerJoin(t.moderationActions, eq(t.moderationActions.id, t.appeals.actionId))
    .innerJoin(decider, eq(decider.id, t.moderationActions.decidedById))
    .leftJoin(t.listings, eq(t.listings.id, t.moderationActions.listingId))
    .where(isNull(t.appeals.reviewedAt))
    .orderBy(asc(t.appeals.createdAt))
    .limit(100);
  const [actor, targets] = await Promise.all([actorOf(viewer), targetsOf([...new Set(rows.map((row) => row.appeal.personId))])]);
  const theirs = rows.filter(
    (row) =>
      row.action.decidedById !== viewer.id && mayActOn(actor, targets.get(row.appeal.personId), row.listingStore) === null,
  );
  return { theirs, targets };
}

appealRoutes.openapi(waiting, async (c) => {
  const { show } = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety', true))) return c.json({ error: onlyLeads }, 403);
  const rows = await db
    .select({
      appeal: t.appeals,
      action: t.moderationActions,
      listingTitle: t.listings.title,
      listingStore: t.listings.storeId,
      decidedBy: decider.displayName,
      reviewedBy: reviewer.displayName,
    })
    .from(t.appeals)
    .innerJoin(t.moderationActions, eq(t.moderationActions.id, t.appeals.actionId))
    .innerJoin(decider, eq(decider.id, t.moderationActions.decidedById))
    .leftJoin(reviewer, eq(reviewer.id, t.appeals.reviewedById))
    .leftJoin(t.listings, eq(t.listings.id, t.moderationActions.listingId))
    .orderBy(desc(t.appeals.createdAt))
    .limit(300);
  const [actor, targets] = await Promise.all([actorOf(viewer), targetsOf([...new Set(rows.map((row) => row.appeal.personId))])]);
  // About users this leader may act on; a waiting one never against their
  // own decision (another leader decides it).
  const theirs = rows.filter(
    (row) =>
      mayActOn(actor, targets.get(row.appeal.personId), row.listingStore) === null &&
      (row.appeal.reviewedAt !== null || row.action.decidedById !== viewer.id),
  );
  const all = theirs.map((row) => {
    const state: Exclude<Show, 'all'> = row.appeal.reviewedAt ? (row.appeal.outcome ?? 'upheld') : 'waiting';
    return {
      at: (row.appeal.reviewedAt ?? row.appeal.createdAt).getTime(),
      created: row.appeal.createdAt.getTime(),
      id: row.appeal.id,
      person: { id: row.appeal.personId, name: targets.get(row.appeal.personId)?.name || 'No name yet' },
      kind: row.action.kind as z.infer<typeof kind>,
      reason: row.action.reason,
      listingTitle: row.listingTitle ?? undefined,
      note: row.action.note ?? undefined,
      decidedBy: row.decidedBy || 'Someone',
      decidedLabel: dayMonth(row.action.createdAt),
      fromReport: row.action.reportId !== null,
      statement: row.appeal.statement,
      agoLabel: agoLabel(row.appeal.createdAt),
      state,
      outcome: row.appeal.reviewedAt
        ? { by: row.reviewedBy || 'Someone', dateLabel: dayMonth(row.appeal.reviewedAt), reason: row.appeal.reason ?? undefined }
        : undefined,
    };
  });
  const counts = Object.fromEntries(SHOW.map((key) => [key, 0])) as Record<Show, number>;
  counts.all = all.length;
  for (const row of all) counts[row.state] += 1;
  // Waiting first, the oldest at the top; then decided, the newest first.
  const shown = all
    .filter((row) => show === 'all' || row.state === show)
    .sort((a, b) =>
      (a.state === 'waiting') !== (b.state === 'waiting')
        ? a.state === 'waiting'
          ? -1
          : 1
        : a.state === 'waiting'
          ? a.created - b.created
          : b.at - a.at,
    )
    .map(({ at: _at, created: _created, ...row }) => row);
  return c.json({ appeals: shown, counts }, 200);
});

const decide = createRoute({
  method: 'post',
  path: '/staff/appeals/{id}',
  tags: ['Staff'],
  summary: 'Uphold or overturn an appeal',
  description:
    'Trust and safety leaders, never on an action they decided. A reason either way, which the user is told. Overturning undoes the action and keeps its record.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            outcome: z.enum(['upheld', 'overturned']),
            reason: z.string({ error: 'Say why, so they understand' }).trim().min(2, 'Say why, so they understand').max(500),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Decided', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    ...errors,
  },
});

appealRoutes.openapi(decide, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety', true))) return c.json({ error: onlyLeads }, 403);
  const [row] = await db
    .select({ appeal: t.appeals, action: t.moderationActions, listingStore: t.listings.storeId })
    .from(t.appeals)
    .innerJoin(t.moderationActions, eq(t.moderationActions.id, t.appeals.actionId))
    .leftJoin(t.listings, eq(t.listings.id, t.moderationActions.listingId))
    .where(eq(t.appeals.id, id));
  if (!row || row.appeal.reviewedAt) return c.json({ error: 'That appeal has been decided already.' }, 404);
  if (row.action.decidedById === viewer.id) {
    return c.json({ error: 'You made this decision, so another leader has to look at the appeal.' }, 403);
  }
  const [actor, targets] = await Promise.all([actorOf(viewer), targetsOf([row.appeal.personId])]);
  const why = mayActOn(actor, targets.get(row.appeal.personId), row.listingStore);
  if (why) return c.json({ error: why }, 403);

  const now = new Date();
  const done = await db.transaction(async (tx) => {
    // Decided once, even if two leads answer at the same moment.
    const [claimed] = await tx
      .update(t.appeals)
      .set({ outcome: body.outcome, reason: body.reason, reviewedById: viewer.id, reviewedAt: now })
      .where(and(eq(t.appeals.id, id), isNull(t.appeals.reviewedAt)))
      .returning({ id: t.appeals.id });
    if (!claimed) return false;
    if (body.outcome === 'overturned') {
      await tx
        .update(t.moderationActions)
        .set({ reversedAt: now, reversedById: viewer.id })
        .where(eq(t.moderationActions.id, row.action.id));
      await undoAction(tx, row.action, now);
    }
    await tx.insert(t.staffLog).values({
      actorId: viewer.id,
      action: body.outcome === 'overturned' ? 'appeal.overturn' : 'appeal.uphold',
      targetPersonId: row.appeal.personId,
      // The reason the lead gave is the decision's note, as on the others.
      detail: { kind: row.action.kind, actionId: row.action.id, note: body.reason },
    });
    return true;
  });
  if (!done) return c.json({ error: 'That appeal has been decided already.' }, 404);

  await notify(
    row.appeal.personId,
    'account',
    body.outcome === 'overturned'
      ? `Your appeal was successful and the decision has been overturned: ${body.reason}`
      : `We looked at your appeal and the decision stands: ${body.reason}`,
    `/appeal/${row.action.id}`,
  );
  return c.json({ ok: true }, 200);
});
