/**
 * The Activity log, in the Staff console (docs/product/staff-console.md,
 * principle 3): what our team did and when, newest first, from `staff_log`.
 * Read only: the console never edits or deletes a row. Trust and safety
 * leads and the super admin see everything; a Trust and safety member sees
 * what members did, without the leads' and the super admin's actions or
 * changes to the team.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, desc, eq, gte, ilike, inArray, lt, notInArray, notLike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { personFor } from './me';
import { reportLabel } from './reports';

export const activityRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

/** Entries a page: 10 unless asked for 20, 30 or 40. */
const PAGE_SIZES = [10, 20, 30, 40] as const;

const EntrySchema = z
  .object({
    id: z.string(),
    /** e.g. "report.approve", "person.view", "team.add". */
    action: z.string(),
    detail: z.record(z.string(), z.unknown()),
    actor: z.object({ id: z.string(), name: z.string() }),
    target: z.object({ id: z.string(), name: z.string() }).optional(),
    /** "29 Oct, 14:05" in Harare's time. */
    atLabel: z.string(),
  })
  .openapi('ActivityEntry');

const list = createRoute({
  method: 'get',
  path: '/staff/activity',
  tags: ['Staff'],
  summary: 'What our team did',
  description: `Trust and safety. 10, 20, 30 or 40 a page (\`size\`), newest first (\`page\` from 1), with how many there are in all. \`q\` finds a name or a kind of action ("warning", "ban"); \`from\` and \`to\` are days. Members see members' actions only.`,
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      size: z.coerce
        .number()
        .int()
        .refine((n) => (PAGE_SIZES as readonly number[]).includes(n), 'Show 10, 20, 30 or 40 a page')
        .default(10),
      /** A name, or what was done ("warning", "ban", "appeal"). */
      q: z.string().trim().max(60).optional(),
      /** "2026-10-29", in Harare's time; both ends included. */
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
  },
  responses: {
    200: {
      description: 'The entries',
      content: {
        'application/json': { schema: z.object({ entries: z.array(EntrySchema), total: z.number(), pageSize: z.number() }) },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "29 Oct, 14:05" in Harare's time (UTC+2), wherever the server runs. */
function atLabel(at: Date): string {
  const local = new Date(at.getTime() + 2 * 60 * 60_000);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}, ${hh}:${mm}`;
}

/** Words people search for, and the actions (or their details) they mean. */
const ACTION_WORDS: [string, string][] = [
  ['warn', 'warning'],
  ['suspen', 'suspension'],
  ['ban', 'ban'],
  ['remov', 'removal'],
  ['look', 'person.view'],
  ['view', 'person.view'],
  ['record', 'person.view'],
  ['report', 'report.'],
  ['clear', 'report.clear'],
  ['appeal', 'appeal.'],
  ['overturn', 'appeal.overturn'],
  ['uphe', 'uphold'],
  ['uphold', 'uphold'],
  ['team', 'team.'],
  ['lead', 'lead'],
];

/** The start of a day in Harare's time (UTC+2). */
const harareDay = (day: string) => new Date(`${day}T00:00:00+02:00`);
const DAY = 24 * 60 * 60_000;

const actor = alias(t.people, 'actor');
const target = alias(t.people, 'target');

activityRoutes.openapi(list, async (c) => {
  const { page, size, q, from, to } = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) {
    return c.json({ error: 'Only Trust and safety can see the Activity log.' }, 403);
  }
  const everything = await inDepartment(viewer, 'trust_safety', true);

  // For a member: only what members did, so not the leads' or the super
  // admin's actions, and not changes to the team.
  let onlyMembers;
  if (!everything) {
    const leads = await db
      .select({ id: t.staffDepartments.personId })
      .from(t.staffDepartments)
      .where(eq(t.staffDepartments.lead, true));
    const admins = await db.select({ id: t.people.id }).from(t.people).where(eq(t.people.role, 'super_admin'));
    const above = [...new Set([...leads, ...admins].map((row) => row.id))];
    onlyMembers = and(
      notLike(t.staffLog.action, 'team.%'),
      above.length ? notInArray(t.staffLog.actorId, above) : undefined,
    );
  }

  // What they searched for, every word counting: a name (who did it, or to
  // whom), or a kind of action ("kuda warning" is Kuda's warnings).
  const search = q
    ? and(
        ...q
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => {
            const meant = ACTION_WORDS.filter(([stem]) => word.toLowerCase().includes(stem)).map(([, action]) => action);
            return or(
              ilike(actor.displayName, `%${word}%`),
              ilike(target.displayName, `%${word}%`),
              ...meant.map((action) => ilike(sql`${t.staffLog.action} || ' ' || ${t.staffLog.detail}::text`, `%${action}%`)),
            );
          }),
      )
    : undefined;
  const where = and(
    onlyMembers,
    search,
    from ? gte(t.staffLog.createdAt, harareDay(from)) : undefined,
    to ? lt(t.staffLog.createdAt, new Date(harareDay(to).getTime() + DAY)) : undefined,
  );

  const [rows, [all]] = await Promise.all([
    db
      .select({
        log: t.staffLog,
        actorName: actor.displayName,
        targetName: target.displayName,
      })
      .from(t.staffLog)
      .innerJoin(actor, eq(actor.id, t.staffLog.actorId))
      .leftJoin(target, eq(target.id, t.staffLog.targetPersonId))
      .where(where)
      .orderBy(desc(t.staffLog.createdAt))
      .limit(size)
      .offset((page - 1) * size),
    db
      .select({ n: count() })
      .from(t.staffLog)
      .innerJoin(actor, eq(actor.id, t.staffLog.actorId))
      .leftJoin(target, eq(target.id, t.staffLog.targetPersonId))
      .where(where),
  ]);

  // Entries about a report saved before its full label was kept: its label,
  // "REP 2026 0014", looked up by its number.
  const numbers = [
    ...new Set(
      rows.flatMap((row) => {
        const detail = (row.log.detail ?? {}) as Record<string, unknown>;
        return typeof detail.report === 'number' && !detail.reportLabel ? [detail.report] : [];
      }),
    ),
  ];
  const labels = numbers.length
    ? new Map(
        (
          await db
            .select({ number: t.reports.number, createdAt: t.reports.createdAt })
            .from(t.reports)
            .where(inArray(t.reports.number, numbers))
        ).map((report) => [report.number, reportLabel(report)]),
      )
    : new Map<number, string>();

  return c.json(
    {
      entries: rows.map((row) => {
        const detail = (row.log.detail ?? {}) as Record<string, unknown>;
        const label = typeof detail.report === 'number' ? labels.get(detail.report) : undefined;
        return {
        id: row.log.id,
        action: row.log.action,
        detail: label ? { ...detail, reportLabel: label } : detail,
        actor: { id: row.log.actorId, name: row.actorName || 'Someone' },
        target: row.log.targetPersonId
          ? { id: row.log.targetPersonId, name: row.targetName || 'No name yet' }
          : undefined,
        atLabel: atLabel(row.log.createdAt),
        };
      }),
      total: all?.n ?? 0,
      pageSize: size,
    },
    200,
  );
});
