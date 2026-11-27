/**
 * Swap & Top's live chat (docs/features/chat.md): Socket.IO at `/socket`,
 * on the site's own address (Dokploy sends `/socket` here), so the browser
 * brings the same sign in cookie. The rules and the database are the API's
 * (@snt/api/chat); this only moves messages as they happen.
 *
 * A connection is signed in or refused. It joins its user's room and its
 * stores' rooms, so a message reaches every device and every member at
 * once. Events, each answered through the acknowledgement:
 * - `send` { chatId, body, replyToId? }: saved first, then passed to both
 *   sides; the receiving side is notified when none of its devices has the
 *   chat open. `replyToId`: the message it answers, quoted above it.
 * - `edit` { chatId, messageId, body }: a message changed by its sender
 *   within 15 minutes; passed to both sides as `edited`.
 * - `open` / `close` { chatId }: which chat this device is looking at.
 * - `read` { chatId }: the other side's messages are marked Seen.
 * - `typing` { chatId }: passed to the other side.
 *
 * Locally it runs on port 4100 beside the site on 3000 (`pnpm --filter
 * @snt/chat dev`); on Dokploy, PORT, DATABASE_URL, AUTH_SECRET and APP_URL
 * are the site's own.
 */

import '@snt/api/loadEnv';
import { createServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import {
  chatFor,
  editMessage,
  markRead,
  notifyMessage,
  otherSide,
  personFor,
  roomOf,
  sendMessage,
  storesOf,
  verify,
} from '@snt/api/chat';

const PORT = Number(process.env.PORT ?? 4100);
const APP_URL = (process.env.APP_URL ?? '').replace(/\/+$/, '');
/** At most this many messages a minute from one user. */
const A_MINUTE = 30;

const http = createServer((request, response) => {
  // For Dokploy's and Uptime Kuma's checks (not under /socket/, which
  // Socket.IO answers itself).
  if (request.url === '/socket-health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }
  response.writeHead(404);
  response.end();
});

const io = new Server(http, {
  path: '/socket',
  // On the server the site and the chat share one address. Locally the
  // site (3000) and the chat (4100) are different ports of localhost.
  cors: APP_URL ? undefined : { origin: true, credentials: true },
  allowRequest: (request, callback) => {
    const origin = request.headers.origin;
    callback(null, !APP_URL || !origin || origin === APP_URL);
  },
});

/** Who a connection is, kept on the socket. */
interface Data {
  /** The signed in account, as the API reads it. */
  user: NonNullable<Awaited<ReturnType<typeof verify>>>;
  personId: string;
  /** The chat this device has open, if any. */
  viewing?: string;
}

io.use(async (socket, next) => {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(socket.handshake.headers)) {
      if (typeof value === 'string') headers.set(name, value);
    }
    const user = await verify(new Request('http://chat/socket', { headers }));
    if (!user) return next(new Error('signin'));
    const person = await personFor(user);
    if (person.deletedAt || person.standing === 'banned') return next(new Error('closed'));
    (socket.data as Data).user = user;
    (socket.data as Data).personId = person.id;
    await socket.join(`person:${person.id}`);
    for (const store of await storesOf(person.id)) await socket.join(`store:${store}`);
    next();
  } catch {
    next(new Error('failed'));
  }
});

const sent = new Map<string, { at: number; n: number }>();

/** The person behind a connection, as fresh as personFor keeps it. */
async function personOf(socket: Socket) {
  return personFor((socket.data as Data).user).catch(() => null);
}

type Ack = (answer: unknown) => void;
const answer = (ack: unknown) => (typeof ack === 'function' ? (ack as Ack) : () => undefined);

io.on('connection', (socket) => {
  const data = socket.data as Data;

  socket.on('open', ({ chatId }: { chatId?: string } = {}) => {
    data.viewing = typeof chatId === 'string' ? chatId : undefined;
  });
  socket.on('close', () => {
    data.viewing = undefined;
  });

  socket.on(
    'send',
    async (
      { chatId, body, replyToId }: { chatId?: string; body?: string; replyToId?: string } = {},
      ack?: unknown,
    ) => {
      const reply = answer(ack);
      if (typeof chatId !== 'string' || typeof body !== 'string') return reply({ error: 'Something went wrong.' });
      const now = Date.now();
      const mine = sent.get(data.personId);
      const count = !mine || now - mine.at > 60_000 ? { at: now, n: 0 } : mine;
      count.n += 1;
      sent.set(data.personId, count);
      if (sent.size > 10_000) sent.clear();
      if (count.n > A_MINUTE) return reply({ error: 'You are sending a lot of messages. Wait a minute.' });

      const person = await personOf(socket);
      if (!person) return reply({ error: 'Sign in again to carry on.' });
      const result = await sendMessage(person, chatId, body, typeof replyToId === 'string' ? replyToId : undefined).catch(
        () => null,
      );
      if (!result) return reply({ error: 'It did not send. Try again.' });
      if ('error' in result) return reply({ error: result.error });

      const { chat, side, message } = result;
      const to = otherSide(side);
      io.to(roomOf(chat, side)).to(roomOf(chat, to)).emit('message', message);
      reply({ ok: true, message });

      // Notified unless one of their devices has this chat open.
      const theirs = await io.in(roomOf(chat, to)).fetchSockets();
      if (!theirs.some((other) => (other.data as Data).viewing === chat.id)) {
        await notifyMessage(chat, to).catch(() => undefined);
      }
    },
  );

  socket.on(
    'edit',
    async (
      { chatId, messageId, body }: { chatId?: string; messageId?: string; body?: string } = {},
      ack?: unknown,
    ) => {
      const reply = answer(ack);
      if (typeof chatId !== 'string' || typeof messageId !== 'string' || typeof body !== 'string') {
        return reply({ error: 'Something went wrong.' });
      }
      const person = await personOf(socket);
      if (!person) return reply({ error: 'Sign in again to carry on.' });
      const result = await editMessage(person, chatId, messageId, body).catch(() => null);
      if (!result) return reply({ error: 'It did not save. Try again.' });
      if ('error' in result) return reply({ error: result.error });
      const { chat, side, message } = result;
      io.to(roomOf(chat, side)).to(roomOf(chat, otherSide(side))).emit('edited', message);
      reply({ ok: true, message });
    },
  );

  socket.on('read', async ({ chatId }: { chatId?: string } = {}, ack?: unknown) => {
    const reply = answer(ack);
    const person = await personOf(socket);
    if (!person || typeof chatId !== 'string') return reply({ error: 'Something went wrong.' });
    const result = await markRead(person, chatId).catch(() => null);
    if (!result || 'error' in result) return reply({ error: 'Something went wrong.' });
    if (result.read > 0) {
      io.to(roomOf(result.chat, otherSide(result.side))).emit('read', { chatId, by: result.side, at: new Date().toISOString() });
    }
    // Their own other devices drop the unread count too.
    io.to(roomOf(result.chat, result.side)).emit('read-mine', { chatId });
    reply({ ok: true, read: result.read });
  });

  socket.on('typing', async ({ chatId }: { chatId?: string } = {}) => {
    const person = await personOf(socket);
    if (!person || typeof chatId !== 'string') return;
    const found = await chatFor(person, chatId).catch(() => null);
    if (!found || 'error' in found) return;
    socket.to(roomOf(found.chat, otherSide(found.side))).emit('typing', { chatId, by: found.side });
  });
});

http.listen(PORT, () => {
  console.info(`Chat is listening on port ${PORT} at /socket.`);
});
