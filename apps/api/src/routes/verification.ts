/**
 * Verified store requests (docs/product/accounts-and-stores.md,
 * "Verification"), in their simple first form: the store's owner asks, with
 * what stands behind the store (a registered business or an informal trader)
 * and its registration or licence number; our team calls to see the
 * documents and arrange a video call or visit; a Trust and safety lead then
 * verifies or declines it here. Verifying sets the store's `verifiedAt`, which shows the
 * Verified store badge; the owner is told either way. A rename pauses the
 * badge (routes/stores.ts), and the owner asks again.
 *
 * Not yet: document photos (no uploads yet), the yearly check, and pausing
 * the badge after upheld reports.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { localPhone } from '../contact';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { personFor } from './me';
import { notify } from './notifications';
import { roleIn } from './post';
import { inDepartment } from '../staff';

export const verificationRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const kind = z.enum(['registered', 'informal']);

const RequestSchema = z
  .object({
    state: z.enum(['pending', 'approved', 'declined']),
    kind,
    reference: z.string(),
    /** Why it was declined. */
    note: z.string().optional(),
    /** "28 Oct" */
    askedLabel: z.string(),
  })
  .openapi('VerificationRequest');

const StandingSchema = z
  .object({
    verified: z.boolean(),
    /** The latest request, if they have asked. */
    request: RequestSchema.nullable(),
  })
  .openapi('VerificationStanding');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayMonth = (at: Date) => `${at.getDate()} ${MONTHS[at.getMonth()]}`;

const errors = {
  400: { description: 'Something is wrong with it', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'Not there', content: { 'application/json': { schema: ErrorSchema } } },
};

/** Where a store stands: verified or not, and its latest request. */
async function standingOf(storeId: string) {
  const [store] = await db.select({ verifiedAt: t.stores.verifiedAt }).from(t.stores).where(eq(t.stores.id, storeId));
  const [latest] = await db
    .select()
    .from(t.verificationRequests)
    .where(eq(t.verificationRequests.storeId, storeId))
    .orderBy(desc(t.verificationRequests.createdAt))
    .limit(1);
  return {
    verified: Boolean(store?.verifiedAt),
    request: latest
      ? {
          state: latest.state,
          kind: latest.kind,
          reference: latest.reference,
          note: latest.note ?? undefined,
          askedLabel: dayMonth(latest.createdAt),
        }
      : null,
  };
}

/* --- the owner's side -------------------------------------------------------- */

const standing = createRoute({
  method: 'get',
  path: '/stores/{id}/verification',
  tags: ['Stores'],
  summary: 'Where a store stands on Verified store',
  description: 'The owner only: whether it is verified, and its latest request.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Its standing', content: { 'application/json': { schema: StandingSchema } } },
    401: errors[401],
    403: errors[403],
  },
});

verificationRoutes.openapi(standing, async (c) => {
  const { id } = c.req.valid('param');
  const person = await personFor(c.get('authUser'));
  if ((await roleIn(person.id, id)) !== 'owner') {
    return c.json({ error: 'Only the store’s owner can see this.' }, 403);
  }
  return c.json(await standingOf(id), 200);
});

const ask = createRoute({
  method: 'post',
  path: '/stores/{id}/verification',
  tags: ['Stores'],
  summary: 'Ask to be verified',
  description:
    'The owner only. What stands behind the store and its registration or licence number; our team then calls to see the documents. One request waits at a time.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            kind,
            reference: z.string().trim().min(2, 'Enter the registration or licence number').max(60),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Asked', content: { 'application/json': { schema: StandingSchema } } },
    ...errors,
  },
});

verificationRoutes.openapi(ask, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  if ((await roleIn(person.id, id)) !== 'owner') {
    return c.json({ error: 'Only the store’s owner can ask for this.' }, 403);
  }
  const now = await standingOf(id);
  if (now.verified) return c.json({ error: 'The store is verified already.' }, 400);
  if (now.request?.state === 'pending') return c.json({ error: 'Your request is with our team already.' }, 400);
  await db.insert(t.verificationRequests).values({
    storeId: id,
    requestedById: person.id,
    kind: body.kind,
    reference: body.reference,
  });
  return c.json(await standingOf(id), 201);
});

/* --- the admin's side -------------------------------------------------------- */

/** Verifying stores is for Trust and safety leads (and the super admin). */
const mayVerify = (person: Parameters<typeof inDepartment>[0]) => inDepartment(person, 'trust_safety', true);

const PendingSchema = z
  .object({
    id: z.string(),
    storeName: z.string(),
    storeSlug: z.string(),
    location: z.string(),
    ownerName: z.string(),
    /** "077 123 4567": to call them. */
    ownerPhone: z.string().optional(),
    kind,
    reference: z.string(),
    askedLabel: z.string(),
  })
  .openapi('PendingVerification');

const pending = createRoute({
  method: 'get',
  path: '/admin/verifications',
  tags: ['Admin'],
  summary: 'Stores waiting to be verified',
  description: 'Trust and safety leads (and the super admin) only. Open stores whose request waits, oldest first.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'The requests',
      content: { 'application/json': { schema: z.object({ requests: z.array(PendingSchema) }) } },
    },
    401: errors[401],
    403: errors[403],
  },
});

verificationRoutes.openapi(pending, async (c) => {
  const person = await personFor(c.get('authUser'));
  if (!(await mayVerify(person))) return c.json({ error: 'Only Trust and safety leads can verify stores.' }, 403);
  const rows = await db
    .select({
      request: t.verificationRequests,
      storeName: t.stores.name,
      storeSlug: t.stores.slug,
      location: t.stores.location,
      ownerName: t.people.displayName,
      ownerPhone: t.people.phone,
    })
    .from(t.verificationRequests)
    .innerJoin(t.stores, eq(t.stores.id, t.verificationRequests.storeId))
    .innerJoin(t.people, eq(t.people.id, t.verificationRequests.requestedById))
    .where(and(eq(t.verificationRequests.state, 'pending'), isNull(t.stores.closedAt)))
    .orderBy(asc(t.verificationRequests.createdAt));
  return c.json(
    {
      requests: rows.map((row) => ({
        id: row.request.id,
        storeName: row.storeName,
        storeSlug: row.storeSlug,
        location: row.location,
        ownerName: row.ownerName,
        ownerPhone: row.ownerPhone ? localPhone(row.ownerPhone) : undefined,
        kind: row.request.kind,
        reference: row.request.reference,
        askedLabel: dayMonth(row.request.createdAt),
      })),
    },
    200,
  );
});

const decide = createRoute({
  method: 'post',
  path: '/admin/verifications/{id}',
  tags: ['Admin'],
  summary: 'Verify or decline a store',
  description: 'Trust and safety leads (and the super admin) only, and never on a store they own or work for. Verifying shows the badge at once; declining needs a reason, which the owner is told.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            decision: z.enum(['approve', 'decline']),
            note: z.string().trim().max(300).optional(),
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

verificationRoutes.openapi(decide, async (c) => {
  const { id } = c.req.valid('param');
  const { decision, note } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  if (!(await mayVerify(person))) return c.json({ error: 'Only Trust and safety leads can verify stores.' }, 403);
  if (decision === 'decline' && !note) return c.json({ error: 'Say why, so the owner knows what to fix.' }, 400);
  const [request] = await db.select().from(t.verificationRequests).where(eq(t.verificationRequests.id, id));
  if (!request || request.state !== 'pending') return c.json({ error: 'That request has been decided already.' }, 404);
  // Nobody decides on a store they own or work for: someone else checks it.
  if (await roleIn(person.id, request.storeId)) {
    return c.json({ error: 'You run this store, so someone else on the team has to decide it.' }, 403);
  }
  const [store] = await db
    .select({ name: t.stores.name, slug: t.stores.slug })
    .from(t.stores)
    .where(eq(t.stores.id, request.storeId));

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(t.verificationRequests)
      .set({
        state: decision === 'approve' ? 'approved' : 'declined',
        note: decision === 'decline' ? note : null,
        decidedById: person.id,
        decidedAt: now,
      })
      .where(eq(t.verificationRequests.id, id));
    if (decision === 'approve') {
      await tx.update(t.stores).set({ verifiedAt: now }).where(eq(t.stores.id, request.storeId));
    }
  });
  await notify(
    request.requestedById,
    'account',
    decision === 'approve'
      ? `${store?.name ?? 'Your store'} is now a Verified store.`
      : `We could not verify ${store?.name ?? 'your store'}: ${note}`,
    decision === 'approve' ? `/store/${store?.slug ?? ''}` : `/store/${store?.slug ?? ''}/edit`,
  );
  return c.json({ ok: true }, 200);
});
