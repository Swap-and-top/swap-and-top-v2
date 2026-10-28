/**
 * Notifications: the in-app record of what is worth knowing (docs/features/
 * notifications.md). A person's own list, and, for the owner and staff of a
 * store, the store's list in the Store console. Each is a short line, a time
 * and a way to the thing it is about.
 *
 * `notify` adds one; the offer endpoints use it to tell the other person.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { personFor } from './me';

export const notificationRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

type Kind = (typeof t.notificationKind.enumValues)[number];

/** Adds a notification to a person's list. */
export async function notify(personId: string, kind: Kind, text: string, href: string) {
  await db.insert(t.notifications).values({ personId, kind, text, href });
}

/** Tells a store: its owner and staff see it in the Store console. */
export async function notifyStore(storeId: string, kind: Kind, text: string, href: string) {
  await db.insert(t.notifications).values({ storeId, kind, text, href });
}

const NotificationSchema = z
  .object({
    id: z.string(),
    audience: z.enum(['user', 'store']),
    /** The store it is for, on a store's. */
    storeId: z.string().optional(),
    kind: z.string(),
    text: z.string(),
    /** "12 minutes ago", "3h ago", "Yesterday", "4 days ago". */
    atLabel: z.string(),
    href: z.string(),
    read: z.boolean(),
  })
  .openapi('Notification');

function atLabel(at: Date): string {
  const minutes = Math.floor((Date.now() - at.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} days ago` : 'Last week';
}

/** The stores this person owns or works for. */
async function storeIdsOf(personId: string): Promise<string[]> {
  const rows = await db
    .select({ storeId: t.storeMembers.storeId })
    .from(t.storeMembers)
    .where(and(eq(t.storeMembers.personId, personId), isNull(t.storeMembers.removedAt)));
  return rows.map((row) => row.storeId);
}

const list = createRoute({
  method: 'get',
  path: '/me/notifications',
  tags: ['Notifications'],
  summary: 'Your notifications',
  description: "Yours (audience user) and, if you own or work for a store, the store's (audience store), newest first.",
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: 'Your notifications',
      content: { 'application/json': { schema: z.object({ notifications: z.array(NotificationSchema) }) } },
    },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

notificationRoutes.openapi(list, async (c) => {
  const person = await personFor(c.get('authUser'));
  const stores = await storeIdsOf(person.id);
  const rows = await db
    .select()
    .from(t.notifications)
    .where(
      stores.length
        ? or(eq(t.notifications.personId, person.id), inArray(t.notifications.storeId, stores))
        : eq(t.notifications.personId, person.id),
    )
    .orderBy(desc(t.notifications.createdAt))
    .limit(100);
  return c.json(
    {
      notifications: rows.map((n) => ({
        id: n.id,
        audience: n.personId ? ('user' as const) : ('store' as const),
        storeId: n.personId ? undefined : (n.storeId ?? undefined),
        kind: n.kind,
        text: n.text,
        atLabel: atLabel(n.createdAt),
        href: n.href,
        read: n.readAt !== null,
      })),
    },
    200,
  );
});

const read = createRoute({
  method: 'post',
  path: '/me/notifications/read',
  tags: ['Notifications'],
  summary: 'Mark notifications read',
  description: 'Only your own, or your stores’; others are left as they are.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.string()).min(1).max(200) }) } } },
  },
  responses: {
    200: { description: 'Read', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

notificationRoutes.openapi(read, async (c) => {
  const { ids } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const stores = await storeIdsOf(person.id);
  const theirs = stores.length
    ? or(eq(t.notifications.personId, person.id), inArray(t.notifications.storeId, stores))
    : eq(t.notifications.personId, person.id);
  await db
    .update(t.notifications)
    .set({ readAt: new Date() })
    .where(and(inArray(t.notifications.id, ids), isNull(t.notifications.readAt), theirs));
  return c.json({ ok: true }, 200);
});
