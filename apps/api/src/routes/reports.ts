/**
 * Reports (docs/features/moderation.md, backend plan section 2, and the
 * Staff console's safeguards in docs/product/staff-console.md section 9).
 *
 * Anyone signed in reports a listing, or a person after a deal check, with
 * one of eight reasons and an optional note. Trust and safety work the
 * queue in the Staff console: claim a report, so two people never work the
 * same one, then approve it with an action (a warning, removing the
 * listing, a 7 day suspension, or a ban, which needs a lead), changing the
 * reason if it was filed under the wrong one, or clear it. Each decision is
 * a `moderation_actions` row and a `staff_log` row, and the person reported
 * is told what was decided. They are never told who reported them.
 *
 * Who may handle a report: a Trust and safety member, about an ordinary
 * user; a lead, also about members of our team; the super admin, also
 * about leads. Nobody handles a report they filed, one about themselves,
 * or one about a listing of a store they own or work for. Nobody acts on
 * the super admin.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, asc, count, eq, gte, inArray, isNull, lt, ne, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { actionText, actorOf, applyAction, mayActOn, mayBan, targetsOf } from '../moderation';
import { inDepartment } from '../staff';
import { appealsWaitingFor } from './appeals';
import { personFor } from './me';
import { notify } from './notifications';

export const reportRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const reason = z.enum(t.reportReason.enumValues);
const action = z.enum(['warning', 'removal', 'suspension', 'ban']);
type Action = z.infer<typeof action>;

/** Reports one person may send a day, so reporting cannot be used to harass. */
const DAILY_REPORTS = 10;
/** A claim left this long can be taken by someone else. */
const CLAIM_MS = 30 * 60_000;
const DAY = 24 * 60 * 60_000;

function agoLabel(at: Date): string {
  const minutes = Math.floor((Date.now() - at.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'Not there', content: { 'application/json': { schema: ErrorSchema } } },
};

/* --- reporting ----------------------------------------------------------------- */

const send = createRoute({
  method: 'post',
  path: '/reports',
  tags: ['Reports'],
  summary: 'Report a listing or a person',
  description: `Signed in. A listing (its poster is the person reported) or a person. Never your own listing or yourself; ${DAILY_REPORTS} reports a day; reporting the same thing again while ours is open changes nothing.`,
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z
            .object({
              listingId: z.string().optional(),
              personId: z.string().optional(),
              reason,
              details: z.string().trim().max(500).optional(),
            })
            .refine((body) => Boolean(body.listingId) !== Boolean(body.personId), 'Report a listing or a person'),
        },
      },
    },
  },
  responses: {
    201: { description: 'Sent', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    ...errors,
    429: { description: 'Too many today', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

reportRoutes.openapi(send, async (c) => {
  const body = c.req.valid('json');
  const person = await personFor(c.get('authUser'));

  let personId = body.personId ?? null;
  const listingId = body.listingId ?? null;
  if (listingId) {
    const [listing] = await db
      .select({ ownerId: t.listings.ownerId })
      .from(t.listings)
      .where(eq(t.listings.id, listingId));
    if (!listing) return c.json({ error: 'That listing is not there any more.' }, 404);
    personId = listing.ownerId;
  } else {
    const [other] = await db.select({ id: t.people.id }).from(t.people).where(eq(t.people.id, personId!));
    if (!other) return c.json({ error: 'That person is not there any more.' }, 404);
  }
  if (personId === person.id) {
    return c.json({ error: listingId ? 'You cannot report your own listing.' : 'You cannot report yourself.' }, 400);
  }

  // Already reported by them and still open: nothing more to do.
  const [already] = await db
    .select({ id: t.reports.id })
    .from(t.reports)
    .where(
      and(
        eq(t.reports.reporterId, person.id),
        inArray(t.reports.state, ['open', 'claimed']),
        listingId ? eq(t.reports.listingId, listingId) : and(eq(t.reports.personId, personId!), isNull(t.reports.listingId)),
      ),
    );
  if (already) return c.json({ ok: true }, 201);

  const [today] = await db
    .select({ n: count() })
    .from(t.reports)
    .where(and(eq(t.reports.reporterId, person.id), gte(t.reports.createdAt, new Date(Date.now() - DAY))));
  if ((today?.n ?? 0) >= DAILY_REPORTS) {
    return c.json({ error: 'You have sent a lot of reports today. Try again tomorrow.' }, 429);
  }

  await db.insert(t.reports).values({
    reporterId: person.id,
    listingId,
    personId: personId!,
    reason: body.reason,
    details: body.details || null,
  });
  return c.json({ ok: true }, 201);
});

/* --- who may handle what ------------------------------------------------------- */

type Person = Awaited<ReturnType<typeof personFor>>;
type Report = typeof t.reports.$inferSelect;

/** What the queue needs to know about the people and listings in it, read once. */
async function contextFor(viewer: Person, reports: Report[]) {
  const listingIds = [...new Set(reports.map((report) => report.listingId).filter((id): id is string => Boolean(id)))];
  const [actor, people, listings] = await Promise.all([
    actorOf(viewer),
    targetsOf([...new Set(reports.map((report) => report.personId))]),
    listingIds.length
      ? db
          .select({ id: t.listings.id, title: t.listings.title, slug: t.listings.slug, status: t.listings.status, storeId: t.listings.storeId })
          .from(t.listings)
          .where(inArray(t.listings.id, listingIds))
      : [],
  ]);
  return { actor, people, listings: new Map(listings.map((row) => [row.id, row])) };
}

type Context = Awaited<ReturnType<typeof contextFor>>;

/** Whether this viewer may handle this report; why not, if not. */
function mayHandle(viewer: Person, report: Report, ctx: Context): string | null {
  if (report.reporterId === viewer.id) return 'You sent this report, so someone else has to handle it.';
  const listing = report.listingId ? ctx.listings.get(report.listingId) : undefined;
  return mayActOn(ctx.actor, ctx.people.get(report.personId), listing?.storeId);
}

/** The violation matrix, kept simple: the same reason and record get the
    same suggestion, whoever handles it. Staff can choose another. */
function suggestedAction(report: Report, upheldBefore: number): Action {
  if (report.reason === 'stolen') return 'suspension';
  if (upheldBefore >= 2) return 'suspension';
  if (report.listingId && ['fake', 'duplicate', 'offensive'].includes(report.reason)) return 'removal';
  return 'warning';
}

/* --- the queue ----------------------------------------------------------------- */

const QueueItemSchema = z
  .object({
    id: z.string(),
    /** "REP 2026 0001" */
    label: z.string(),
    reason,
    details: z.string().optional(),
    /** "3h ago" */
    agoLabel: z.string(),
    listing: z
      .object({ title: z.string(), slug: z.string(), status: z.string() })
      .optional(),
    person: z.object({
      id: z.string(),
      name: z.string(),
      standing: z.string(),
      /** Actions upheld against them before, not reversed. */
      upheldBefore: z.number(),
      /** Other reports about them still open. */
      otherOpen: z.number(),
    }),
    reporterName: z.string(),
    /** Who has it, when someone has claimed it. */
    claimedBy: z.string().optional(),
    mine: z.boolean(),
    suggested: action,
  })
  .openapi('ReportQueueItem');

const queue = createRoute({
  method: 'get',
  path: '/staff/reports',
  tags: ['Staff'],
  summary: 'Reports waiting',
  description: 'Trust and safety. Open and claimed reports this person may handle, oldest first.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'The queue',
      content: { 'application/json': { schema: z.object({ reports: z.array(QueueItemSchema) }) } },
    },
    401: errors[401],
    403: errors[403],
  },
});

const notTrustSafety = 'Only Trust and safety can handle reports.';

reportRoutes.openapi(queue, async (c) => {
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: notTrustSafety }, 403);
  const rows = await db
    .select()
    .from(t.reports)
    .where(inArray(t.reports.state, ['open', 'claimed']))
    .orderBy(asc(t.reports.createdAt))
    .limit(200);
  const ctx = await contextFor(viewer, rows);
  const mine = rows.filter((report) => mayHandle(viewer, report, ctx) === null);
  if (mine.length === 0) return c.json({ reports: [] }, 200);

  const personIds = [...new Set(mine.map((report) => report.personId))];
  const reporterIds = [...new Set(mine.map((report) => report.reporterId))];
  const claimerIds = [...new Set(mine.map((report) => report.claimedById).filter((id): id is string => Boolean(id)))];
  const [upheld, open, names] = await Promise.all([
    db
      .select({ personId: t.moderationActions.personId, n: count() })
      .from(t.moderationActions)
      .where(
        and(
          inArray(t.moderationActions.personId, personIds),
          ne(t.moderationActions.kind, 'none'),
          isNull(t.moderationActions.reversedAt),
        ),
      )
      .groupBy(t.moderationActions.personId),
    db
      .select({ personId: t.reports.personId, n: count() })
      .from(t.reports)
      .where(and(inArray(t.reports.personId, personIds), inArray(t.reports.state, ['open', 'claimed'])))
      .groupBy(t.reports.personId),
    db
      .select({ id: t.people.id, name: t.people.displayName })
      .from(t.people)
      .where(inArray(t.people.id, [...new Set([...reporterIds, ...claimerIds])])),
  ]);
  const upheldOf = new Map(upheld.map((row) => [row.personId, row.n]));
  const openOf = new Map(open.map((row) => [row.personId, row.n]));
  const nameOf = new Map(names.map((row) => [row.id, row.name]));
  const now = Date.now();

  return c.json(
    {
      reports: mine.map((report) => {
        const target = ctx.people.get(report.personId);
        const listing = report.listingId ? ctx.listings.get(report.listingId) : undefined;
        const held =
          report.state === 'claimed' && report.claimedById && report.claimedAt && now - report.claimedAt.getTime() < CLAIM_MS;
        const before = upheldOf.get(report.personId) ?? 0;
        return {
          id: report.id,
          label: `REP ${report.createdAt.getFullYear()} ${String(report.number).padStart(4, '0')}`,
          reason: report.reason,
          details: report.details ?? undefined,
          agoLabel: agoLabel(report.createdAt),
          listing: listing ? { title: listing.title, slug: listing.slug, status: listing.status } : undefined,
          person: {
            id: report.personId,
            name: target?.name || 'No name yet',
            standing: target?.standing ?? 'good',
            upheldBefore: before,
            otherOpen: Math.max(0, (openOf.get(report.personId) ?? 1) - 1),
          },
          reporterName: nameOf.get(report.reporterId) || 'No name yet',
          claimedBy: held ? nameOf.get(report.claimedById!) || 'Someone' : undefined,
          mine: Boolean(held && report.claimedById === viewer.id),
          suggested: suggestedAction(report, before),
        };
      }),
    },
    200,
  );
});

/** A report this viewer may handle, or the reason they may not. */
async function reportFor(viewer: Person, id: string): Promise<{ report: Report; ctx: Context } | { error: string; status: 403 | 404 }> {
  if (!(await inDepartment(viewer, 'trust_safety'))) return { error: notTrustSafety, status: 403 };
  const [report] = await db.select().from(t.reports).where(eq(t.reports.id, id));
  if (!report || report.state === 'approved' || report.state === 'cleared') {
    return { error: 'That report has been handled already.', status: 404 };
  }
  const ctx = await contextFor(viewer, [report]);
  const why = mayHandle(viewer, report, ctx);
  return why ? { error: why, status: 403 } : { report, ctx };
}

const claim = createRoute({
  method: 'post',
  path: '/staff/reports/{id}/claim',
  tags: ['Staff'],
  summary: 'Claim a report',
  description: 'Trust and safety. Takes a report to work on, so nobody else does. A claim left for 30 minutes can be taken by someone else.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Claimed', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    ...errors,
    409: { description: 'Someone else has it', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

reportRoutes.openapi(claim, async (c) => {
  const { id } = c.req.valid('param');
  const viewer = await personFor(c.get('authUser'));
  const found = await reportFor(viewer, id);
  if ('error' in found) return c.json({ error: found.error }, found.status);
  const now = new Date();
  // Taken only if nobody holds it (or their claim has gone stale), in the
  // same statement, so two people tapping at once cannot both get it.
  const [taken] = await db
    .update(t.reports)
    .set({ state: 'claimed', claimedById: viewer.id, claimedAt: now })
    .where(
      and(
        eq(t.reports.id, id),
        or(
          eq(t.reports.state, 'open'),
          eq(t.reports.claimedById, viewer.id),
          lt(t.reports.claimedAt, new Date(now.getTime() - CLAIM_MS)),
        ),
      ),
    )
    .returning({ id: t.reports.id });
  if (!taken) return c.json({ error: 'Someone else on the team is working on this report.' }, 409);
  return c.json({ ok: true }, 200);
});

const decide = createRoute({
  method: 'post',
  path: '/staff/reports/{id}/decide',
  tags: ['Staff'],
  summary: 'Approve or clear a report',
  description:
    'Trust and safety, on a report they have claimed. Approve with an action (a ban needs a Trust and safety lead), under the report’s reason or a corrected one; or clear it. The person reported is told what was decided, never who reported them.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            decision: z.enum(['approve', 'clear']),
            action: action.optional(),
            reason: reason.optional(),
            note: z.string().trim().max(500).optional(),
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

reportRoutes.openapi(decide, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const viewer = await personFor(c.get('authUser'));
  const found = await reportFor(viewer, id);
  if ('error' in found) return c.json({ error: found.error }, found.status);
  const { report, ctx } = found;
  if (report.state !== 'claimed' || report.claimedById !== viewer.id) {
    return c.json({ error: 'Claim the report first.' }, 400);
  }
  const kind = body.decision === 'clear' ? 'none' : body.action;
  if (!kind) return c.json({ error: 'Choose what to do.' }, 400);
  if (kind === 'ban' && !mayBan(ctx.actor)) {
    return c.json({ error: 'Only a Trust and safety lead can ban an account.' }, 403);
  }
  const listing = report.listingId ? ctx.listings.get(report.listingId) : undefined;
  if (kind === 'removal' && !listing) return c.json({ error: 'This report is about a person, not a listing.' }, 400);
  const decidedReason = body.reason ?? report.reason;
  const now = new Date();

  const { until, actionId } = await db.transaction(async (tx) => {
    await tx
      .update(t.reports)
      .set({ state: body.decision === 'clear' ? 'cleared' : 'approved', reason: decidedReason, closedAt: now })
      .where(eq(t.reports.id, id));
    const ends = kind === 'none' ? null : await applyAction(tx, { personId: report.personId, listingId: report.listingId, kind, now });
    const [made] = await tx.insert(t.moderationActions).values({
      reportId: id,
      personId: report.personId,
      listingId: report.listingId,
      decidedById: viewer.id,
      kind,
      reason: decidedReason,
      note: body.note || null,
      until: ends,
    }).returning({ id: t.moderationActions.id });
    await tx.insert(t.staffLog).values({
      actorId: viewer.id,
      action: body.decision === 'clear' ? 'report.clear' : 'report.approve',
      targetPersonId: report.personId,
      detail: {
        report: report.number,
        ...(kind !== 'none' ? { kind } : {}),
        reason: decidedReason,
        ...(decidedReason !== report.reason ? { filedAs: report.reason } : {}),
        ...(report.listingId ? { listingId: report.listingId } : {}),
      },
    });
    return { until: ends, actionId: made!.id };
  });

  // The person reported hears what was decided, never who reported them,
  // with a link to see it and appeal.
  if (kind !== 'none') {
    await notify(report.personId, 'account', actionText(kind, decidedReason, { listingTitle: listing?.title, until, fromReport: true }), `/appeal/${actionId}`);
  }
  return c.json({ ok: true }, 200);
});

/* --- what is waiting, for the console's menu --------------------------------- */

const counts = createRoute({
  method: 'get',
  path: '/staff/counts',
  tags: ['Staff'],
  summary: 'Work waiting',
  description:
    'Trust and safety. Reports nobody holds that this person may handle, and, for leads, appeals waiting for them. For the counts beside Reports and Appeals.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'The counts',
      content: { 'application/json': { schema: z.object({ reports: z.number(), appeals: z.number() }) } },
    },
    401: errors[401],
    403: errors[403],
  },
});

reportRoutes.openapi(counts, async (c) => {
  const viewer = await personFor(c.get('authUser'));
  const [member, lead] = await Promise.all([
    inDepartment(viewer, 'trust_safety'),
    inDepartment(viewer, 'trust_safety', true),
  ]);
  if (!member) return c.json({ error: notTrustSafety }, 403);
  const now = Date.now();
  const [rows, appeals] = await Promise.all([
    db
      .select()
      .from(t.reports)
      .where(
        or(
          eq(t.reports.state, 'open'),
          and(eq(t.reports.state, 'claimed'), lt(t.reports.claimedAt, new Date(now - CLAIM_MS))),
        ),
      )
      .limit(200),
    lead ? appealsWaitingFor(viewer) : null,
  ]);
  const ctx = await contextFor(viewer, rows);
  return c.json(
    {
      reports: rows.filter((report) => mayHandle(viewer, report, ctx) === null).length,
      appeals: appeals?.theirs.length ?? 0,
    },
    200,
  );
});
