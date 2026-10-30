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
import { desc, eq, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
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
          // A decline's reason is the owner's to read; a verify's note is
          // for the record only.
          note: latest.state === 'declined' ? (latest.note ?? undefined) : undefined,
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

/** What the list can be narrowed to: waiting, or how it was decided. */
const SHOW = ['all', 'waiting', 'verified', 'declined'] as const;
type Show = (typeof SHOW)[number];

const RequestRowSchema = z
  .object({
    id: z.string(),
    storeName: z.string(),
    storeSlug: z.string(),
    location: z.string(),
    ownerId: z.string(),
    ownerName: z.string(),
    /** "077 123 4567": to call them. */
    ownerPhone: z.string().optional(),
    kind,
    reference: z.string(),
    askedLabel: z.string(),
    /** Waiting for a leader, or how it was decided. */
    state: z.enum(['waiting', 'verified', 'declined']),
    /** Once decided: by whom, when ("29 Oct") and why. */
    decided: z.object({ by: z.string(), dateLabel: z.string(), note: z.string().optional() }).optional(),
  })
  .openapi('VerificationRow');

const pending = createRoute({
  method: 'get',
  path: '/admin/verifications',
  tags: ['Admin'],
  summary: 'Requests to be verified',
  description:
    'Trust and safety leaders (and the super admin) only. Every request from an open store: the waiting ones first, oldest first, then the decided ones, newest first. `show` narrows it to waiting, verified or declined; `counts` says how many each would show.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { query: z.object({ show: z.enum(SHOW).default('all') }) },
  responses: {
    200: {
      description: 'The requests',
      content: {
        'application/json': {
          schema: z.object({ requests: z.array(RequestRowSchema), counts: z.record(z.enum(SHOW), z.number()) }),
        },
      },
    },
    401: errors[401],
    403: errors[403],
  },
});

const decider = alias(t.people, 'decider');

verificationRoutes.openapi(pending, async (c) => {
  const { show } = c.req.valid('query');
  const person = await personFor(c.get('authUser'));
  if (!(await mayVerify(person))) return c.json({ error: 'Only Trust and safety leaders can verify stores.' }, 403);
  const rows = await db
    .select({
      request: t.verificationRequests,
      storeName: t.stores.name,
      storeSlug: t.stores.slug,
      location: t.stores.location,
      ownerName: t.people.displayName,
      ownerPhone: t.people.phone,
      deciderName: decider.displayName,
    })
    .from(t.verificationRequests)
    .innerJoin(t.stores, eq(t.stores.id, t.verificationRequests.storeId))
    .innerJoin(t.people, eq(t.people.id, t.verificationRequests.requestedById))
    .leftJoin(decider, eq(decider.id, t.verificationRequests.decidedById))
    .where(isNull(t.stores.closedAt))
    .orderBy(desc(t.verificationRequests.createdAt))
    .limit(300);
  const all = rows.map((row) => {
    const state: Exclude<Show, 'all'> =
      row.request.state === 'pending' ? 'waiting' : row.request.state === 'approved' ? 'verified' : 'declined';
    return {
      at: (row.request.decidedAt ?? row.request.createdAt).getTime(),
      created: row.request.createdAt.getTime(),
      id: row.request.id,
      storeName: row.storeName,
      storeSlug: row.storeSlug,
      location: row.location,
      ownerId: row.request.requestedById,
      ownerName: row.ownerName || 'No name yet',
      ownerPhone: row.ownerPhone ? localPhone(row.ownerPhone) : undefined,
      kind: row.request.kind,
      reference: row.request.reference,
      askedLabel: dayMonth(row.request.createdAt),
      state,
      decided: row.request.decidedAt
        ? { by: row.deciderName || 'Someone', dateLabel: dayMonth(row.request.decidedAt), note: row.request.note ?? undefined }
        : undefined,
    };
  });
  const counts = Object.fromEntries(SHOW.map((key) => [key, 0])) as Record<Show, number>;
  counts.all = all.length;
  for (const row of all) counts[row.state] += 1;
  // Waiting first, the oldest at the top; then decided, the newest first.
  const requests = all
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
  return c.json({ requests, counts }, 200);
});

const decide = createRoute({
  method: 'post',
  path: '/admin/verifications/{id}',
  tags: ['Admin'],
  summary: 'Verify or decline a store',
  description: 'Trust and safety leaders (and the super admin) only, and never on a store they own or work for. Either way a note saying why is required: verifying shows the badge at once and keeps the note on the record; declining tells the owner the note.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            decision: z.enum(['approve', 'decline']),
            note: z.string({ error: 'Say why you decided this' }).trim().min(2, 'Say why you decided this').max(300),
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
  if (!(await mayVerify(person))) return c.json({ error: 'Only Trust and safety leaders can verify stores.' }, 403);
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
        // Why, either way: a decline's is told to the owner, a verify's is
        // kept for the record.
        note,
        decidedById: person.id,
        decidedAt: now,
      })
      .where(eq(t.verificationRequests.id, id));
    if (decision === 'approve') {
      await tx.update(t.stores).set({ verifiedAt: now }).where(eq(t.stores.id, request.storeId));
    }
    // In the Activity log, as every Trust and safety decision is.
    await tx.insert(t.staffLog).values({
      actorId: person.id,
      action: decision === 'approve' ? 'store.verify' : 'store.decline',
      targetPersonId: request.requestedById,
      detail: { store: store?.name ?? '', storeId: request.storeId, note },
    });
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
