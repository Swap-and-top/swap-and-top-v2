/**
 * Team (docs/product/staff-console.md, section 4): who is in which
 * department, as a member or its lead, and the changes to it.
 *
 * Who may do what:
 * - The super admin manages every department, makes and unmakes leads, and
 *   can take someone off the team altogether.
 * - A lead manages the members of the department they lead: adds them and
 *   takes them out. They cannot make leads, change a lead, or change their
 *   own access.
 * - Nobody else sees Team.
 *
 * Every change is written to `staff_log`.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Department } from '@snt/core';
import { and, asc, eq, ilike, inArray, like, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { localPhone } from '../contact';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { staffOf } from '../staff';
import { personFor } from './me';

export const teamRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const DEPARTMENTS = ['trust_safety', 'sales', 'finance', 'marketing', 'devops', 'executives', 'board'] as const;
const department = z.enum(DEPARTMENTS);

const MemberSchema = z
  .object({
    personId: z.string(),
    name: z.string(),
    /** "077 123 4567" */
    phone: z.string().optional(),
    /** Their departments, among those the asker manages. */
    departments: z.array(z.object({ department, lead: z.boolean() })),
    /** The asker themselves: their own access cannot be changed here. */
    self: z.boolean(),
  })
  .openapi('TeamMember');

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'No such person', content: { 'application/json': { schema: ErrorSchema } } },
};

type Asker = Awaited<ReturnType<typeof personFor>>;

/** The departments this person manages: all for the super admin, else the
    ones they lead. Empty: no Team for them. */
async function managed(asker: Asker): Promise<Department[]> {
  if (asker.role === 'super_admin') return [...DEPARTMENTS];
  return (await staffOf(asker)).filter((row) => row.lead).map((row) => row.department);
}

async function memberOut(personId: string, depts: Department[], askerId: string) {
  const [person] = await db
    .select({ id: t.people.id, name: t.people.displayName, phone: t.people.phone })
    .from(t.people)
    .where(eq(t.people.id, personId));
  if (!person) return null;
  const rows = await db
    .select({ department: t.staffDepartments.department, lead: t.staffDepartments.lead })
    .from(t.staffDepartments)
    .where(and(eq(t.staffDepartments.personId, personId), inArray(t.staffDepartments.department, depts)));
  return {
    personId: person.id,
    name: person.name || 'No name yet',
    phone: person.phone ? localPhone(person.phone) : undefined,
    departments: DEPARTMENTS.filter((d) => rows.some((r) => r.department === d)).map((d) => ({
      department: d,
      lead: rows.find((r) => r.department === d)!.lead,
    })),
    self: person.id === askerId,
  };
}

async function log(actorId: string, action: string, targetPersonId: string, detail: Record<string, unknown>) {
  await db.insert(t.staffLog).values({ actorId, action, targetPersonId, detail });
}

/* --- the list ------------------------------------------------------------------ */

const list = createRoute({
  method: 'get',
  path: '/staff/team',
  tags: ['Staff'],
  summary: 'The team',
  description:
    'The super admin and leads only. Everyone in the departments the asker manages (all for the super admin, else the ones they lead), with their places in those departments.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'The team',
      content: {
        'application/json': {
          schema: z.object({
            /** The departments the asker may change. */
            manages: z.array(department),
            /** Only the super admin makes leads and removes from the whole team. */
            superAdmin: z.boolean(),
            members: z.array(MemberSchema),
          }),
        },
      },
    },
    401: errors[401],
    403: errors[403],
  },
});

teamRoutes.openapi(list, async (c) => {
  const asker = await personFor(c.get('authUser'));
  const depts = await managed(asker);
  if (depts.length === 0) return c.json({ error: 'Team is for the super admin and department leads.' }, 403);
  const rows = await db
    .selectDistinct({ personId: t.staffDepartments.personId, name: t.people.displayName })
    .from(t.staffDepartments)
    .innerJoin(t.people, eq(t.people.id, t.staffDepartments.personId))
    .where(inArray(t.staffDepartments.department, depts))
    .orderBy(asc(t.people.displayName));
  const members = (await Promise.all(rows.map((row) => memberOut(row.personId, depts, asker.id)))).filter(
    (member): member is NonNullable<typeof member> => member !== null,
  );
  return c.json({ manages: depts, superAdmin: asker.role === 'super_admin', members }, 200);
});

/* --- finding someone to add -------------------------------------------------------- */

const find = createRoute({
  method: 'get',
  path: '/staff/team/find',
  tags: ['Staff'],
  summary: 'Find a person to add',
  description: 'The super admin and leads only. Up to 10 people whose name or phone number matches.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { query: z.object({ q: z.string().trim().min(2) }) },
  responses: {
    200: { description: 'Matches', content: { 'application/json': { schema: z.object({ people: z.array(MemberSchema) }) } } },
    ...errors,
  },
});

teamRoutes.openapi(find, async (c) => {
  const { q } = c.req.valid('query');
  const asker = await personFor(c.get('authUser'));
  const depts = await managed(asker);
  if (depts.length === 0) return c.json({ error: 'Team is for the super admin and department leads.' }, 403);
  // A number as people write it, "077 123", searched as stored, "+26377123".
  const digits = q.replace(/\D/g, '');
  const phone = digits.length >= 3 ? `%${digits.startsWith('0') ? `263${digits.slice(1)}` : digits}%` : null;
  const rows = await db
    .select({ id: t.people.id })
    .from(t.people)
    .where(or(ilike(t.people.displayName, `%${q}%`), phone ? like(t.people.phone, phone) : undefined))
    .orderBy(asc(t.people.displayName))
    .limit(10);
  const people = (await Promise.all(rows.map((row) => memberOut(row.id, depts, asker.id)))).filter(
    (member): member is NonNullable<typeof member> => member !== null,
  );
  return c.json({ people }, 200);
});

/* --- a department switched on, or its Lead -------------------------------------------- */

const params = z.object({ personId: z.string(), department });

/** Why this asker may not change this person's place in this department,
    or null when they may. */
async function refusal(asker: Asker, personId: string, dept: Department, lead?: boolean) {
  const superAdmin = asker.role === 'super_admin';
  if (!(await managed(asker)).includes(dept)) return 'You can only change the departments you lead.';
  if (personId === asker.id && !superAdmin) return 'You cannot change your own access. Ask the super admin.';
  const [target] = await db.select({ role: t.people.role }).from(t.people).where(eq(t.people.id, personId));
  if (!target) return 'That person is not there any more.';
  if (target.role === 'super_admin') return 'The super admin already sees everything.';
  if (!superAdmin) {
    if (lead) return 'Only the super admin makes leads.';
    const [row] = await db
      .select({ lead: t.staffDepartments.lead })
      .from(t.staffDepartments)
      .where(and(eq(t.staffDepartments.personId, personId), eq(t.staffDepartments.department, dept)));
    if (row?.lead) return 'Only the super admin changes a lead.';
  }
  return null;
}

const put = createRoute({
  method: 'put',
  path: '/staff/team/{personId}/{department}',
  tags: ['Staff'],
  summary: 'Put someone in a department',
  description:
    'Adds them, or changes whether they lead it. The super admin, or a lead adding members to their own department (never a lead, never themselves).',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params,
    body: { content: { 'application/json': { schema: z.object({ lead: z.boolean() }) } } },
  },
  responses: {
    200: { description: 'Saved', content: { 'application/json': { schema: MemberSchema } } },
    ...errors,
  },
});

teamRoutes.openapi(put, async (c) => {
  const { personId, department: dept } = c.req.valid('param');
  const { lead } = c.req.valid('json');
  const asker = await personFor(c.get('authUser'));
  const refused = await refusal(asker, personId, dept, lead);
  if (refused) return c.json({ error: refused }, 403);
  const [was] = await db
    .select({ lead: t.staffDepartments.lead })
    .from(t.staffDepartments)
    .where(and(eq(t.staffDepartments.personId, personId), eq(t.staffDepartments.department, dept)));
  if (!was) {
    await db.insert(t.staffDepartments).values({ personId, department: dept, lead, addedById: asker.id });
    await log(asker.id, 'team.add', personId, { department: dept, lead });
  } else if (was.lead !== lead) {
    await db
      .update(t.staffDepartments)
      .set({ lead })
      .where(and(eq(t.staffDepartments.personId, personId), eq(t.staffDepartments.department, dept)));
    await log(asker.id, lead ? 'team.lead' : 'team.unlead', personId, { department: dept });
  }
  return c.json((await memberOut(personId, await managed(asker), asker.id))!, 200);
});

const remove = createRoute({
  method: 'delete',
  path: '/staff/team/{personId}/{department}',
  tags: ['Staff'],
  summary: 'Take someone out of a department',
  description: 'The super admin, or a lead taking a member (never a lead, never themselves) out of their own department.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params },
  responses: {
    200: { description: 'Taken out', content: { 'application/json': { schema: MemberSchema } } },
    ...errors,
  },
});

teamRoutes.openapi(remove, async (c) => {
  const { personId, department: dept } = c.req.valid('param');
  const asker = await personFor(c.get('authUser'));
  const refused = await refusal(asker, personId, dept);
  if (refused) return c.json({ error: refused }, 403);
  const gone = await db
    .delete(t.staffDepartments)
    .where(and(eq(t.staffDepartments.personId, personId), eq(t.staffDepartments.department, dept)))
    .returning({ lead: t.staffDepartments.lead });
  if (gone.length) await log(asker.id, 'team.remove', personId, { department: dept, wasLead: gone[0]!.lead });
  return c.json((await memberOut(personId, await managed(asker), asker.id))!, 200);
});

/* --- off the team altogether ---------------------------------------------------------- */

const leave = createRoute({
  method: 'delete',
  path: '/staff/team/{personId}',
  tags: ['Staff'],
  summary: 'Remove from the team',
  description: 'The super admin only: takes every department away at once, as when someone leaves the company.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ personId: z.string() }) },
  responses: {
    200: { description: 'Removed', content: { 'application/json': { schema: z.object({ removed: z.number() }) } } },
    ...errors,
  },
});

teamRoutes.openapi(leave, async (c) => {
  const { personId } = c.req.valid('param');
  const asker = await personFor(c.get('authUser'));
  if (asker.role !== 'super_admin') return c.json({ error: 'Only the super admin removes someone from the team.' }, 403);
  const gone = await db
    .delete(t.staffDepartments)
    .where(eq(t.staffDepartments.personId, personId))
    .returning({ department: t.staffDepartments.department, lead: t.staffDepartments.lead });
  if (gone.length) await log(asker.id, 'team.leave', personId, { departments: gone });
  return c.json({ removed: gone.length }, 200);
});
