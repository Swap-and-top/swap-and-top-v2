/**
 * Send feedback: anyone, signed in or not, can tell us what they think from
 * the menu (POST /feedback), and everyone on our team reads it in the Staff
 * console's Feedback section (GET /staff/feedback), newest first. A signed
 * in sender's name and account id come with it, so their recording can be
 * found in Clarity (filter by the account id).
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { count, desc, eq } from 'drizzle-orm';
import { requireAuth, verify, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { staffOf } from '../staff';
import { personFor } from './me';

export const feedbackRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

/** At most this many messages an hour from one address. */
const AN_HOUR = 5;
const recent = new Map<string, { at: number; n: number }>();

const send = createRoute({
  method: 'post',
  path: '/feedback',
  tags: ['Feedback'],
  summary: 'Send us feedback',
  description:
    'What someone wants to tell us, with the page they came from. No sign in needed; a signed in sender is noted. At most 5 an hour from one address.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().trim().min(1, 'Write a few words first').max(2000, 'Keep it under 2,000 characters'),
            page: z.string().trim().max(200).optional(),
          }),
        },
      },
    },
  },
  responses: {
    204: { description: 'Sent' },
    429: { description: 'Too many at once', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

feedbackRoutes.openapi(send, async (c) => {
  const { message, page } = c.req.valid('json');
  const from = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'here';
  const now = Date.now();
  const mine = recent.get(from);
  const fresh = !mine || now - mine.at > 60 * 60_000 ? { at: now, n: 0 } : mine;
  fresh.n += 1;
  recent.set(from, fresh);
  if (recent.size > 5000) recent.clear();
  if (fresh.n > AN_HOUR) {
    return c.json({ error: 'Thank you, we have your messages. Try again in an hour.' }, 429);
  }
  const user = await verify(c.req.raw);
  const person = user ? await personFor(user) : null;
  await db.insert(t.feedback).values({
    personId: person?.id ?? null,
    message,
    // Only a path on our site, never an address elsewhere.
    page: page?.startsWith('/') ? page : null,
  });
  return c.body(null, 204);
});

/** Messages a page: 10 unless asked for 20, 30 or 40. */
const PAGE_SIZES = [10, 20, 30, 40] as const;

const EntrySchema = z
  .object({
    id: z.string(),
    message: z.string(),
    page: z.string().nullable(),
    /** Who sent it, if they were signed in. */
    person: z.object({ id: z.string(), name: z.string() }).nullable(),
    /** "29 Oct, 14:05" in Harare's time. */
    atLabel: z.string(),
  })
  .openapi('FeedbackEntry');

const list = createRoute({
  method: 'get',
  path: '/staff/feedback',
  tags: ['Staff'],
  summary: 'What users told us',
  description: 'Everyone on the team. 10, 20, 30 or 40 a page (`size`), newest first (`page` from 1), with how many there are in all.',
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
    }),
  },
  responses: {
    200: {
      description: 'The messages',
      content: { 'application/json': { schema: z.object({ entries: z.array(EntrySchema), total: z.number() }) } },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not on the team', content: { 'application/json': { schema: ErrorSchema } } },
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

feedbackRoutes.openapi(list, async (c) => {
  const { page, size } = c.req.valid('query');
  const viewer = await personFor(c.get('authUser'));
  const onTeam = viewer.role === 'super_admin' || (await staffOf(viewer)).length > 0;
  if (!onTeam) return c.json({ error: 'Only our team can see feedback.' }, 403);

  const [rows, [all]] = await Promise.all([
    db
      .select({ row: t.feedback, name: t.people.displayName })
      .from(t.feedback)
      .leftJoin(t.people, eq(t.people.id, t.feedback.personId))
      .orderBy(desc(t.feedback.createdAt))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ n: count() }).from(t.feedback),
  ]);
  return c.json(
    {
      entries: rows.map(({ row, name }) => ({
        id: row.id,
        message: row.message,
        page: row.page,
        person: row.personId ? { id: row.personId, name: name ?? 'A user' } : null,
        atLabel: atLabel(row.createdAt),
      })),
      total: all?.n ?? 0,
    },
    200,
  );
});
