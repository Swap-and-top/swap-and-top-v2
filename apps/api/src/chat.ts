/**
 * Chat's rules (docs/features/chat.md), in one place for both the API's
 * routes (routes/chats.ts: the list, a chat's messages, starting, read,
 * block) and the live chat app (apps/chat: sending, typing, seen).
 *
 * A chat has two sides: whoever started it ("from") and the listing's owner
 * ("owner"). A side is a store when the chat names one, and then any of the
 * store's members writes as the store. It is closed for both while either
 * user is banned or one has blocked the other, worked out each time.
 */

import { and, count, desc, eq, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';
import { photoUrl } from './r2';
import { notify, notifyStore } from './routes/notifications';

export type Person = typeof t.people.$inferSelect;
export type Chat = typeof t.chats.$inferSelect;
export type Side = 'from' | 'owner';

/** At most this long, a message. */
export const MAX_MESSAGE = 2000;

/** The stores this person is a current member of. */
export async function storesOf(personId: string): Promise<string[]> {
  const rows = await db
    .select({ id: t.storeMembers.storeId })
    .from(t.storeMembers)
    .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
    .where(and(eq(t.storeMembers.personId, personId), isNull(t.storeMembers.removedAt), isNull(t.stores.closedAt)));
  return rows.map((row) => row.id);
}

/** Which side of the chat this person is on, if either. */
export function sideOf(chat: Chat, personId: string, stores: string[]): Side | null {
  const on = (personSide: string, storeSide: string | null) =>
    storeSide ? stores.includes(storeSide) : personSide === personId;
  if (on(chat.fromPersonId, chat.fromStoreId)) return 'from';
  if (on(chat.ownerPersonId, chat.ownerStoreId)) return 'owner';
  return null;
}

export const otherSide = (side: Side): Side => (side === 'from' ? 'owner' : 'from');

/** The room a side's sockets are in: its user's, or its store's. */
export function roomOf(chat: Chat, side: Side): string {
  const store = side === 'from' ? chat.fromStoreId : chat.ownerStoreId;
  const person = side === 'from' ? chat.fromPersonId : chat.ownerPersonId;
  return store ? `store:${store}` : `person:${person}`;
}

/** Why the chat is closed for both, if it is. */
export async function closedReason(chat: Chat): Promise<'banned' | 'blocked' | null> {
  const [people, blocks] = await Promise.all([
    db
      .select({ standing: t.people.standing, deletedAt: t.people.deletedAt })
      .from(t.people)
      .where(inArray(t.people.id, [chat.fromPersonId, chat.ownerPersonId])),
    db
      .select({ n: count() })
      .from(t.chatBlocks)
      .where(
        or(
          and(eq(t.chatBlocks.blockerId, chat.fromPersonId), eq(t.chatBlocks.blockedId, chat.ownerPersonId)),
          and(eq(t.chatBlocks.blockerId, chat.ownerPersonId), eq(t.chatBlocks.blockedId, chat.fromPersonId)),
        ),
      ),
  ]);
  if (people.some((person) => person.standing === 'banned' || person.deletedAt)) return 'banned';
  if ((blocks[0]?.n ?? 0) > 0) return 'blocked';
  return null;
}

type Refusal = { error: string; status: 400 | 403 | 404 };

/** A person not allowed to write now: suspended or banned. */
function cannotWrite(person: Person): Refusal | null {
  if (person.standing === 'suspended' || person.standing === 'banned') {
    return { error: 'Your account cannot send messages right now.', status: 403 };
  }
  return null;
}

/**
 * Opens a chat, or finds the one already there: from a listing whose owner
 * offers Message as a contact way, or from an offer the owner accepted.
 */
export async function startChat(
  person: Person,
  from: { listingId?: string; offerId?: string },
): Promise<{ chat: Chat } | Refusal> {
  const refused = cannotWrite(person);
  if (refused) return refused;
  const stores = await storesOf(person.id);

  if (from.offerId) {
    const [offer] = await db.select().from(t.offers).where(eq(t.offers.id, from.offerId));
    if (!offer) return { error: 'That offer is gone.', status: 404 };
    if (offer.state !== 'accepted') return { error: 'A chat opens once the offer is accepted.', status: 400 };
    const [listing] = await db.select().from(t.listings).where(eq(t.listings.id, offer.listingId));
    if (!listing) return { error: 'That listing is gone.', status: 404 };
    const isSender = offer.fromStoreId ? stores.includes(offer.fromStoreId) : offer.fromPersonId === person.id;
    const isOwner = listing.storeId ? stores.includes(listing.storeId) : listing.ownerId === person.id;
    if (!isSender && !isOwner) return { error: 'This is not your offer.', status: 403 };
    const [chat] = await db
      .insert(t.chats)
      .values({
        listingId: listing.id,
        offerId: offer.id,
        fromPersonId: offer.fromPersonId,
        fromStoreId: offer.fromStoreId,
        ownerPersonId: listing.ownerId,
        ownerStoreId: listing.storeId,
      })
      .onConflictDoUpdate({
        target: [t.chats.listingId, t.chats.fromPersonId],
        set: { offerId: offer.id },
      })
      .returning();
    return { chat: chat! };
  }

  if (!from.listingId) return { error: 'Say which listing.', status: 400 };
  const [listing] = await db.select().from(t.listings).where(eq(t.listings.id, from.listingId));
  if (!listing || listing.status !== 'live') return { error: 'That listing is no longer up.', status: 404 };
  const own = listing.storeId ? stores.includes(listing.storeId) : listing.ownerId === person.id;
  if (own) return { error: 'This is your own listing.', status: 400 };
  const [existing] = await db
    .select()
    .from(t.chats)
    .where(and(eq(t.chats.listingId, listing.id), eq(t.chats.fromPersonId, person.id)));
  if (existing) return { chat: existing };
  if (!listing.contactChannels.includes('message')) {
    return { error: 'This seller does not take messages here.', status: 403 };
  }
  // The seller's contact rules: only those whose offer they accepted.
  if (listing.contactShownTo === 'offers') {
    const [accepted] = await db
      .select({ id: t.offers.id })
      .from(t.offers)
      .where(
        and(
          eq(t.offers.listingId, listing.id),
          eq(t.offers.fromPersonId, person.id),
          eq(t.offers.state, 'accepted'),
        ),
      );
    if (!accepted) return { error: 'This seller talks to people whose offer they accepted.', status: 403 };
  }
  const [chat] = await db
    .insert(t.chats)
    .values({
      listingId: listing.id,
      fromPersonId: person.id,
      ownerPersonId: listing.ownerId,
      ownerStoreId: listing.storeId,
    })
    .onConflictDoNothing()
    .returning();
  if (chat) return { chat };
  const [again] = await db
    .select()
    .from(t.chats)
    .where(and(eq(t.chats.listingId, listing.id), eq(t.chats.fromPersonId, person.id)));
  return { chat: again! };
}

/** A chat the person may see, with their side; or why not. */
export async function chatFor(
  person: Person,
  chatId: string,
): Promise<{ chat: Chat; side: Side; stores: string[] } | Refusal> {
  const [chat] = await db.select().from(t.chats).where(eq(t.chats.id, chatId));
  if (!chat) return { error: 'That chat is gone.', status: 404 };
  const stores = await storesOf(person.id);
  const side = sideOf(chat, person.id, stores);
  if (!side) return { error: 'This is not your chat.', status: 403 };
  return { chat, side, stores };
}

export interface MessageOut {
  id: string;
  chatId: string;
  body: string;
  /** Which side sent it. */
  side: Side;
  at: string;
  readAt: string | null;
}

export function messageOut(chat: Chat, message: typeof t.chatMessages.$inferSelect): MessageOut {
  // Written as a store: whichever side that store is. Otherwise the user
  // who started it, unless they wrote for a store on that side.
  const fromSide = message.senderStoreId
    ? message.senderStoreId === chat.fromStoreId
    : !chat.fromStoreId && message.senderPersonId === chat.fromPersonId;
  return {
    id: message.id,
    chatId: message.chatId,
    body: message.body,
    side: fromSide ? 'from' : 'owner',
    at: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
  };
}

/** Saves a message, if the person may write it; says to whom it goes. */
export async function sendMessage(
  person: Person,
  chatId: string,
  typed: string,
): Promise<{ chat: Chat; side: Side; message: MessageOut } | Refusal> {
  const body = typed.trim();
  if (!body) return { error: 'Write something first.', status: 400 };
  if (body.length > MAX_MESSAGE) return { error: 'Keep it under 2,000 characters.', status: 400 };
  const refused = cannotWrite(person);
  if (refused) return refused;
  const found = await chatFor(person, chatId);
  if ('error' in found) return found;
  const { chat, side } = found;
  if (await closedReason(chat)) return { error: 'This chat is closed.', status: 403 };
  const store = side === 'from' ? chat.fromStoreId : chat.ownerStoreId;
  const now = new Date();
  const [saved] = await db
    .insert(t.chatMessages)
    .values({ chatId: chat.id, senderPersonId: person.id, senderStoreId: store, body, createdAt: now })
    .returning();
  await db.update(t.chats).set({ lastMessageAt: now }).where(eq(t.chats.id, chat.id));
  return { chat, side, message: messageOut(chat, saved!) };
}

/** Marks the other side's messages read; how many were. */
export async function markRead(person: Person, chatId: string): Promise<{ chat: Chat; side: Side; read: number } | Refusal> {
  const found = await chatFor(person, chatId);
  if ('error' in found) return found;
  const { chat, side } = found;
  const theirs = theirMessages(chat, side);
  const read = await db
    .update(t.chatMessages)
    .set({ readAt: new Date() })
    .where(and(eq(t.chatMessages.chatId, chat.id), isNull(t.chatMessages.readAt), theirs))
    .returning({ id: t.chatMessages.id });
  return { chat, side, read: read.length };
}

/** The messages in a chat the other side sent, as a condition. */
function theirMessages(chat: Chat, side: Side) {
  const other = otherSide(side);
  const store = other === 'from' ? chat.fromStoreId : chat.ownerStoreId;
  const person = other === 'from' ? chat.fromPersonId : chat.ownerPersonId;
  return store ? eq(t.chatMessages.senderStoreId, store) : and(eq(t.chatMessages.senderPersonId, person), isNull(t.chatMessages.senderStoreId));
}

/** A side's name: the store's, or the user's. */
export async function sideName(chat: Chat, side: Side): Promise<string> {
  const store = side === 'from' ? chat.fromStoreId : chat.ownerStoreId;
  if (store) {
    const [row] = await db.select({ name: t.stores.name }).from(t.stores).where(eq(t.stores.id, store));
    return row?.name ?? 'A store';
  }
  const person = side === 'from' ? chat.fromPersonId : chat.ownerPersonId;
  const [row] = await db.select({ name: t.people.displayName }).from(t.people).where(eq(t.people.id, person));
  return row?.name ?? 'A user';
}

/** Tells the side a message went to, unless it already has an unread note
    about this chat (one note however many messages). */
export async function notifyMessage(chat: Chat, to: Side): Promise<void> {
  const store = to === 'from' ? chat.fromStoreId : chat.ownerStoreId;
  const person = to === 'from' ? chat.fromPersonId : chat.ownerPersonId;
  const href = store ? `/console/messages/${chat.id}` : `/messages/${chat.id}`;
  const [waiting] = await db
    .select({ id: t.notifications.id })
    .from(t.notifications)
    .where(and(eq(t.notifications.href, href), eq(t.notifications.kind, 'message'), isNull(t.notifications.readAt)));
  if (waiting) return;
  const [name, [listing]] = await Promise.all([
    sideName(chat, otherSide(to)),
    db.select({ title: t.listings.title }).from(t.listings).where(eq(t.listings.id, chat.listingId)),
  ]);
  const text = `${name} sent you a message about ${listing?.title ?? 'a listing'}`;
  if (store) await notifyStore(store, 'message', text, href);
  else await notify(person, 'message', text, href);
}

export interface ChatSummary {
  id: string;
  /** This viewer's side. */
  side: Side;
  other: { name: string };
  listing: { slug: string; title: string; photo: string | null };
  last: { body: string; side: Side; at: string } | null;
  unread: number;
  closed: 'banned' | 'blocked' | null;
}

/** The chats a viewer sees: their own, or a store's they belong to. */
export async function chatList(person: Person, storeId?: string): Promise<ChatSummary[] | Refusal> {
  const stores = await storesOf(person.id);
  if (storeId && !stores.includes(storeId)) return { error: 'You are not a member of this store.', status: 403 };
  const where = storeId
    ? or(eq(t.chats.fromStoreId, storeId), eq(t.chats.ownerStoreId, storeId))
    : or(
        and(eq(t.chats.fromPersonId, person.id), isNull(t.chats.fromStoreId)),
        and(eq(t.chats.ownerPersonId, person.id), isNull(t.chats.ownerStoreId)),
      );
  const chats = await db
    .select()
    .from(t.chats)
    .where(where)
    .orderBy(desc(sql`coalesce(${t.chats.lastMessageAt}, ${t.chats.createdAt})`))
    .limit(100);
  if (!chats.length) return [];
  const viewerStores = storeId ? [storeId] : [];
  return Promise.all(
    chats.map(async (chat) => {
      const side = sideOf(chat, person.id, viewerStores)!;
      const [name, listing, [last], [unread], closed] = await Promise.all([
        sideName(chat, otherSide(side)),
        listingCard(chat.listingId),
        db
          .select()
          .from(t.chatMessages)
          .where(eq(t.chatMessages.chatId, chat.id))
          .orderBy(desc(t.chatMessages.createdAt))
          .limit(1),
        db
          .select({ n: count() })
          .from(t.chatMessages)
          .where(and(eq(t.chatMessages.chatId, chat.id), isNull(t.chatMessages.readAt), theirMessages(chat, side))),
        closedReason(chat),
      ]);
      const lastOut = last ? messageOut(chat, last) : null;
      return {
        id: chat.id,
        side,
        other: { name },
        listing,
        last: lastOut ? { body: lastOut.body, side: lastOut.side, at: lastOut.at } : null,
        unread: unread?.n ?? 0,
        closed,
      };
    }),
  );
}

/** How many chats have messages this viewer has not read. */
export async function unreadChats(person: Person, storeId?: string): Promise<number> {
  const list = await chatList(person, storeId);
  return 'error' in list ? 0 : list.filter((chat) => chat.unread > 0).length;
}

/** A listing as a chat shows it at the top: its title and first photo. */
export async function listingCard(listingId: string): Promise<{ slug: string; title: string; photo: string | null }> {
  const [row] = await db
    .select({
      slug: t.listings.slug,
      title: t.listings.title,
      sale: t.saleDetails.itemId,
      swap: t.swapDetails.hasItemId,
    })
    .from(t.listings)
    .leftJoin(t.saleDetails, eq(t.saleDetails.listingId, t.listings.id))
    .leftJoin(t.swapDetails, eq(t.swapDetails.listingId, t.listings.id))
    .where(eq(t.listings.id, listingId));
  if (!row) return { slug: '', title: 'A listing', photo: null };
  const itemId = row.sale ?? row.swap;
  const [item] = itemId ? await db.select({ images: t.items.images }).from(t.items).where(eq(t.items.id, itemId)) : [];
  const photo = item?.images[0];
  return { slug: row.slug, title: row.title, photo: photo ? photoUrl(photo) : null };
}

/** A page of a chat's messages, oldest first, before a time if given. */
export async function messagesOf(chat: Chat, before?: Date, limit = 50): Promise<{ messages: MessageOut[]; more: boolean }> {
  const rows = await db
    .select()
    .from(t.chatMessages)
    .where(and(eq(t.chatMessages.chatId, chat.id), before ? lt(t.chatMessages.createdAt, before) : undefined))
    .orderBy(desc(t.chatMessages.createdAt))
    .limit(limit + 1);
  const more = rows.length > limit;
  return { messages: rows.slice(0, limit).reverse().map((row) => messageOut(chat, row)), more };
}

/** Blocks the other side's user, or lifts it. */
export async function setBlock(person: Person, chatId: string, block: boolean): Promise<{ chat: Chat } | Refusal> {
  const found = await chatFor(person, chatId);
  if ('error' in found) return found;
  const { chat, side } = found;
  const other = side === 'from' ? chat.ownerPersonId : chat.fromPersonId;
  if (other === person.id) return { error: 'You cannot block yourself.', status: 400 };
  if (block) {
    await db.insert(t.chatBlocks).values({ blockerId: person.id, blockedId: other }).onConflictDoNothing();
  } else {
    await db.delete(t.chatBlocks).where(and(eq(t.chatBlocks.blockerId, person.id), eq(t.chatBlocks.blockedId, other)));
  }
  return { chat };
}

/** Whether this person has blocked the other side's user. */
export async function blockedByMe(person: Person, chat: Chat, side: Side): Promise<boolean> {
  const other = side === 'from' ? chat.ownerPersonId : chat.fromPersonId;
  const [row] = await db
    .select({ n: count() })
    .from(t.chatBlocks)
    .where(and(eq(t.chatBlocks.blockerId, person.id), eq(t.chatBlocks.blockedId, other)));
  return (row?.n ?? 0) > 0;
}

/** For staff: the chat's messages, only when a report names it. */
export async function reportedChat(chatId: string) {
  const [report] = await db
    .select({ id: t.reports.id })
    .from(t.reports)
    .where(and(eq(t.reports.chatId, chatId), ne(t.reports.state, 'cleared')));
  return report ?? null;
}
