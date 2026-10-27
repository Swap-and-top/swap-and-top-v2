/**
 * Deal checks: did the deal go through? Two things start one (see
 * packages/core/src/types/deal.ts): an accepted offer asks both people; a
 * number reveal asks the one who revealed, and the listing's owner only once
 * they say yes. A deal counts, on both people's records, when both say yes.
 * A "no" is never shown to the other side and carries no consequence.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, desc, eq, lte, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { personFor } from './me';

export const dealRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const answer = z.enum(['yes', 'no', 'not-yet', 'unanswered']);

const DealSchema = z
  .object({
    id: z.string(),
    source: z.enum(['offer', 'reveal']),
    offerId: z.string().optional(),
    revealId: z.string().optional(),
    listingId: z.string(),
    askerId: z.string(),
    ownerId: z.string(),
    askerAnswer: answer,
    ownerAnswer: answer,
    state: z.enum(['pending', 'confirmed', 'closed', 'lapsed']),
    promptedAt: z.string(),
    lapsesAt: z.string(),
  })
  .openapi('DealCheck');

const day = (at: Date | null) => (at ? at.toISOString().slice(0, 10) : '');

function dealOut(row: typeof t.dealChecks.$inferSelect): z.infer<typeof DealSchema> {
  return {
    id: row.id,
    source: row.source,
    offerId: row.offerId ?? undefined,
    revealId: row.revealId ?? undefined,
    listingId: row.listingId,
    askerId: row.askerId,
    ownerId: row.ownerId,
    askerAnswer: row.askerAnswer ?? 'unanswered',
    ownerAnswer: row.ownerAnswer ?? 'unanswered',
    state: row.state,
    promptedAt: day(row.promptedAt),
    lapsesAt: day(row.lapsesAt),
  };
}

/** Deals both people said yes to, on one person's record. */
export async function confirmedDealsOf(personId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(t.dealChecks)
    .where(
      and(
        eq(t.dealChecks.state, 'confirmed'),
        or(eq(t.dealChecks.askerId, personId), eq(t.dealChecks.ownerId, personId)),
      ),
    );
  return row?.n ?? 0;
}

const mine = createRoute({
  method: 'get',
  path: '/me/deals',
  tags: ['Deals'],
  summary: 'Deal checks you are asked about',
  description:
    'Newest first. On a reveal the owner is asked only once the one who revealed says yes. Also your count of confirmed deals.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'Your deal checks',
      content: {
        'application/json': {
          schema: z.object({ deals: z.array(DealSchema), confirmedDeals: z.number().int() }),
        },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

dealRoutes.openapi(mine, async (c) => {
  const person = await personFor(c.get('authUser'));
  const rows = await db
    .select()
    .from(t.dealChecks)
    .where(
      and(
        lte(t.dealChecks.promptedAt, new Date()),
        or(
          eq(t.dealChecks.askerId, person.id),
          and(
            eq(t.dealChecks.ownerId, person.id),
            or(eq(t.dealChecks.source, 'offer'), eq(t.dealChecks.askerAnswer, 'yes')),
          ),
        ),
      ),
    )
    .orderBy(desc(t.dealChecks.promptedAt));
  return c.json({ deals: rows.map(dealOut), confirmedDeals: await confirmedDealsOf(person.id) }, 200);
});

const respond = createRoute({
  method: 'patch',
  path: '/deals/{id}',
  tags: ['Deals'],
  summary: 'Answer a deal check',
  description: 'Yes, no or not yet. Both yes confirms the deal; a no closes it quietly.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { 'application/json': { schema: z.object({ answer: z.enum(['yes', 'no', 'not-yet']) }) } },
    },
  },
  responses: {
    200: {
      description: 'Answered',
      content: {
        'application/json': { schema: z.object({ deal: DealSchema, confirmedDeals: z.number().int() }) },
      },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not asked', content: { 'application/json': { schema: ErrorSchema } } },
    404: { description: 'No such deal check', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

dealRoutes.openapi(respond, async (c) => {
  const { id } = c.req.valid('param');
  const { answer: given } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const [deal] = await db.select().from(t.dealChecks).where(eq(t.dealChecks.id, id));
  if (!deal) return c.json({ error: 'That deal check is not there any more.' }, 404);
  const asker = deal.askerId === person.id;
  const asked =
    asker ||
    (deal.ownerId === person.id && (deal.source === 'offer' || deal.askerAnswer === 'yes'));
  if (!asked) return c.json({ error: 'You are not asked about this deal.' }, 403);

  const now = new Date();
  const askerAnswer = asker ? given : deal.askerAnswer;
  const ownerAnswer = asker ? deal.ownerAnswer : given;
  const state =
    askerAnswer === 'yes' && ownerAnswer === 'yes'
      ? 'confirmed'
      : askerAnswer === 'no' || ownerAnswer === 'no'
        ? 'closed'
        : 'pending';
  const [updated] = await db
    .update(t.dealChecks)
    .set({
      ...(asker ? { askerAnswer: given, askerAnsweredAt: now } : { ownerAnswer: given, ownerAnsweredAt: now }),
      state,
      resolvedAt: state === 'pending' ? null : now,
    })
    .where(eq(t.dealChecks.id, id))
    .returning();
  return c.json({ deal: dealOut(updated!), confirmedDeals: await confirmedDealsOf(person.id) }, 200);
});
