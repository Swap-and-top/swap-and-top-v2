/**
 * Chat, through the API (docs/features/chat.md): a viewer's chats, or a
 * store's; opening one (from a listing's Message, or an accepted offer);
 * a chat with its latest messages, and older ones; marking read; blocking.
 * Sending, typing and Seen go through the live chat app (apps/chat), which
 * uses the same rules (../chat.ts). And, for Trust and safety, a reported
 * chat, each look logged.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import {
  blockedByMe,
  chatFor,
  chatList,
  closedReason,
  listingCard,
  markRead,
  messagesOf,
  otherSide,
  reportedChat,
  setBlock,
  sideFace,
  sideName,
  soldClosesAt,
  startChat,
  unreadChats,
} from '../chat';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { inDepartment } from '../staff';
import { personFor } from './me';

export const chatRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const Side = z.enum(['from', 'owner']);
const Closed = z.enum(['banned', 'blocked', 'sold']).nullable();
const Listing = z.object({
  slug: z.string(),
  title: z.string(),
  photo: z.string().nullable(),
  type: z.enum(['sale', 'swap', 'request', 'auction']),
  terms: z.string(),
});
const Message = z
  .object({
    id: z.string(),
    chatId: z.string(),
    body: z.string(),
    side: Side,
    at: z.string(),
    readAt: z.string().nullable(),
    replyTo: z.object({ id: z.string(), body: z.string(), side: Side }).nullable(),
    editedAt: z.string().nullable(),
    /** What it first said, when changed: on a reported chat, for our team. */
    original: z.string().optional(),
  })
  .openapi('ChatMessage');
const Summary = z
  .object({
    id: z.string(),
    side: Side,
    other: z.object({ name: z.string(), logo: z.string().nullable(), store: z.boolean() }),
    listing: Listing,
    last: z.object({ body: z.string(), side: Side, at: z.string() }).nullable(),
    unread: z.number(),
    closed: Closed,
    closesAt: z.string().nullable(),
  })
  .openapi('ChatSummary');
const errors = {
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'Not there', content: { 'application/json': { schema: ErrorSchema } } },
};
const StoreQuery = z.object({
  /** A store's chats, for its members (the Store console). */
  storeId: z.string().optional(),
});

const list = createRoute({
  method: 'get',
  path: '/chats',
  tags: ['Chat'],
  summary: 'Your chats',
  description: 'Newest message first: your own, or a store\'s you are a member of (`storeId`).',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { query: StoreQuery },
  responses: {
    200: { description: 'The chats', content: { 'application/json': { schema: z.object({ chats: z.array(Summary) }) } } },
    ...errors,
  },
});

chatRoutes.openapi(list, async (c) => {
  const person = await personFor(c.get('authUser'));
  const chats = await chatList(person, c.req.valid('query').storeId);
  if ('error' in chats) return c.json({ error: chats.error }, 403);
  return c.json({ chats }, 200);
});

const unread = createRoute({
  method: 'get',
  path: '/chats/unread',
  tags: ['Chat'],
  summary: 'How many chats have unread messages',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { query: StoreQuery },
  responses: {
    200: { description: 'The count', content: { 'application/json': { schema: z.object({ count: z.number() }) } } },
    ...errors,
  },
});

chatRoutes.openapi(unread, async (c) => {
  const person = await personFor(c.get('authUser'));
  return c.json({ count: await unreadChats(person, c.req.valid('query').storeId) }, 200);
});

const start = createRoute({
  method: 'post',
  path: '/chats',
  tags: ['Chat'],
  summary: 'Open a chat',
  description:
    'From a listing whose owner offers Message as a contact way (`listingId`), within their contact rules; or from an offer the owner accepted (`offerId`), for either side. Opening it again finds the same chat.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z
            .object({ listingId: z.string().optional(), offerId: z.string().optional() })
            .refine((body) => Boolean(body.listingId) !== Boolean(body.offerId), 'Say a listing or an offer'),
        },
      },
    },
  },
  responses: {
    200: { description: 'The chat', content: { 'application/json': { schema: z.object({ id: z.string() }) } } },
    400: { description: 'Not possible', content: { 'application/json': { schema: ErrorSchema } } },
    ...errors,
  },
});

chatRoutes.openapi(start, async (c) => {
  const person = await personFor(c.get('authUser'));
  const result = await startChat(person, c.req.valid('json'));
  if ('error' in result) return c.json({ error: result.error }, result.status);
  return c.json({ id: result.chat.id }, 200);
});

const Detail = z
  .object({
    id: z.string(),
    side: Side,
    /** The store this viewer writes as, if a store's chat. */
    asStoreId: z.string().nullable(),
    other: z.object({ name: z.string(), logo: z.string().nullable(), store: z.boolean() }),
    listing: Listing,
    closed: Closed,
    /** The listing is sold: when this chat closes. */
    closesAt: z.string().nullable(),
    blockedByMe: z.boolean(),
    messages: z.array(Message),
    more: z.boolean(),
  })
  .openapi('Chat');

const read = createRoute({
  method: 'get',
  path: '/chats/{id}',
  tags: ['Chat'],
  summary: 'A chat',
  description: 'Its listing, the other side, whether it is closed, and its latest 50 messages, oldest first.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'The chat', content: { 'application/json': { schema: Detail } } },
    ...errors,
  },
});

chatRoutes.openapi(read, async (c) => {
  const person = await personFor(c.get('authUser'));
  const found = await chatFor(person, c.req.valid('param').id);
  if ('error' in found) return c.json({ error: found.error }, found.status === 404 ? 404 : 403);
  const { chat, side } = found;
  const [other, listing, closed, blocked, page, closesAt] = await Promise.all([
    sideFace(chat, otherSide(side)),
    listingCard(chat.listingId),
    closedReason(chat),
    blockedByMe(person, chat, side),
    messagesOf(chat),
    soldClosesAt(chat),
  ]);
  return c.json(
    {
      id: chat.id,
      side,
      asStoreId: (side === 'from' ? chat.fromStoreId : chat.ownerStoreId) ?? null,
      other,
      listing,
      closed,
      closesAt: closed ? null : (closesAt?.toISOString() ?? null),
      blockedByMe: blocked,
      messages: page.messages,
      more: page.more,
    },
    200,
  );
});

const older = createRoute({
  method: 'get',
  path: '/chats/{id}/messages',
  tags: ['Chat'],
  summary: 'Older messages',
  description: 'Up to 50 sent before `before` (a time), oldest first.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }), query: z.object({ before: z.string().datetime() }) },
  responses: {
    200: {
      description: 'The messages',
      content: { 'application/json': { schema: z.object({ messages: z.array(Message), more: z.boolean() }) } },
    },
    ...errors,
  },
});

chatRoutes.openapi(older, async (c) => {
  const person = await personFor(c.get('authUser'));
  const found = await chatFor(person, c.req.valid('param').id);
  if ('error' in found) return c.json({ error: found.error }, found.status === 404 ? 404 : 403);
  return c.json(await messagesOf(found.chat, new Date(c.req.valid('query').before)), 200);
});

const markAsRead = createRoute({
  method: 'post',
  path: '/chats/{id}/read',
  tags: ['Chat'],
  summary: 'Mark a chat read',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Marked', content: { 'application/json': { schema: z.object({ read: z.number() }) } } },
    ...errors,
  },
});

chatRoutes.openapi(markAsRead, async (c) => {
  const person = await personFor(c.get('authUser'));
  const result = await markRead(person, c.req.valid('param').id);
  if ('error' in result) return c.json({ error: result.error }, result.status === 404 ? 404 : 403);
  return c.json({ read: result.read }, 200);
});

const block = createRoute({
  method: 'put',
  path: '/chats/{id}/block',
  tags: ['Chat'],
  summary: 'Block or unblock the other side',
  description: 'Blocking closes every chat between the two users, for both, until it is lifted. The other side is not told who.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: z.object({ block: z.boolean() }) } } },
  },
  responses: {
    200: { description: 'Done', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    400: { description: 'Not possible', content: { 'application/json': { schema: ErrorSchema } } },
    ...errors,
  },
});

chatRoutes.openapi(block, async (c) => {
  const person = await personFor(c.get('authUser'));
  const result = await setBlock(person, c.req.valid('param').id, c.req.valid('json').block);
  if ('error' in result) return c.json({ error: result.error }, result.status);
  return c.json({ ok: true }, 200);
});

/* ── For Trust and safety: a reported chat ─────────────────────────────── */

const staffRead = createRoute({
  method: 'get',
  path: '/staff/chats/{id}',
  tags: ['Staff'],
  summary: 'A reported chat',
  description:
    'Trust and safety, and only for a chat a report names (not cleared). Each look is logged in the Activity log. The latest 200 messages.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: 'The chat',
      content: {
        'application/json': {
          schema: z.object({
            from: z.object({ name: z.string() }),
            owner: z.object({ name: z.string() }),
            listing: Listing,
            messages: z.array(Message),
          }),
        },
      },
    },
    ...errors,
  },
});

chatRoutes.openapi(staffRead, async (c) => {
  const viewer = await personFor(c.get('authUser'));
  if (!(await inDepartment(viewer, 'trust_safety'))) return c.json({ error: 'Only Trust and safety can read chats.' }, 403);
  const id = c.req.valid('param').id;
  const report = await reportedChat(id);
  if (!report) return c.json({ error: 'Only a reported chat can be read.' }, 403);
  const [chat] = await db.select().from(t.chats).where(eq(t.chats.id, id));
  if (!chat) return c.json({ error: 'That chat is gone.' }, 404);
  const [fromName, ownerName, listing, page] = await Promise.all([
    sideName(chat, 'from'),
    sideName(chat, 'owner'),
    listingCard(chat.listingId),
    messagesOf(chat, undefined, 200, true),
  ]);
  await db.insert(t.staffLog).values({
    actorId: viewer.id,
    action: 'chat.view',
    targetPersonId: chat.fromPersonId,
    detail: { chat: chat.id, report: report.id },
  });
  return c.json({ from: { name: fromName }, owner: { name: ownerName }, listing, messages: page.messages }, 200);
});
