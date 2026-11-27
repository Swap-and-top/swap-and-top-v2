'use client';

/**
 * Chat in the browser (docs/features/chat.md). Chats and their messages load
 * from the API with TanStack Query (`chatKeys`); sending, Seen and typing go
 * through the live chat app over Socket.IO (`chatSocket`), at `/socket` on
 * the site's own address, or on port 4100 beside a local dev server.
 * ChatConnection (components/ChatConnection.tsx) keeps the socket open while
 * someone is signed in and puts what arrives into the cache.
 */

import type { QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';

export type Side = 'from' | 'owner';

export interface ChatMessage {
  id: string;
  chatId: string;
  body: string;
  side: Side;
  at: string;
  readAt: string | null;
  /** The message it answers, quoted above it. */
  replyTo: { id: string; body: string; side: Side } | null;
  /** When its sender last changed it: "Edited" under it. */
  editedAt: string | null;
  /** What it first said, on a reported chat, for our team. */
  original?: string;
}

/** How long a message can be changed after it is sent: 15 minutes. */
export const EDIT_WINDOW_MS = 15 * 60_000;

export interface ChatSummary {
  id: string;
  side: Side;
  /** `logo` when the other side is a store with one; `store` when it is a
      store at all. */
  other: { name: string; logo: string | null; store: boolean };
  listing: { slug: string; title: string; photo: string | null; type: 'sale' | 'swap' | 'request' | 'auction'; terms: string };
  last: { body: string; side: Side; at: string } | null;
  unread: number;
  closed: 'banned' | 'blocked' | 'sold' | null;
  /** The listing is sold: when this chat closes. */
  closesAt: string | null;
}

export interface ChatDetail {
  id: string;
  side: Side;
  asStoreId: string | null;
  other: { name: string; logo: string | null; store: boolean };
  listing: { slug: string; title: string; photo: string | null; type: 'sale' | 'swap' | 'request' | 'auction'; terms: string };
  closed: 'banned' | 'blocked' | 'sold' | null;
  /** The listing is sold: when this chat closes. */
  closesAt: string | null;
  blockedByMe: boolean;
  messages: ChatMessage[];
  more: boolean;
}

export const chatKeys = {
  all: ['chats'] as const,
  list: (storeId?: string) => ['chats', 'list', storeId ?? 'me'] as const,
  unread: (storeId?: string) => ['chats', 'unread', storeId ?? 'me'] as const,
  chat: (id: string) => ['chats', 'chat', id] as const,
};

let socket: Socket | null = null;

/** The one live connection, made on first use; not yet connected. */
export function chatSocket(): Socket {
  if (!socket) {
    // A local dev server (port 3000) has the chat beside it on 4100.
    const local = window.location.port === '3000';
    socket = io(local ? `${window.location.protocol}//${window.location.hostname}:4100` : undefined, {
      path: '/socket',
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

/** Sends a message (answering another, if `replyToId`); the saved
    message, or why not. */
export async function sendChatMessage(
  chatId: string,
  body: string,
  replyToId?: string,
): Promise<{ message?: ChatMessage; error?: string }> {
  const live = chatSocket();
  if (!live.connected) return { error: 'You are offline. It will send once you are back.' };
  try {
    const answer = (await live.timeout(10_000).emitWithAck('send', { chatId, body, replyToId })) as {
      ok?: boolean;
      message?: ChatMessage;
      error?: string;
    };
    return answer.error ? { error: answer.error } : { message: answer.message };
  } catch {
    return { error: 'It did not send. Check your connection and try again.' };
  }
}

/** Changes a message of yours; the saved message, or why not. */
export async function editChatMessage(
  chatId: string,
  messageId: string,
  body: string,
): Promise<{ message?: ChatMessage; error?: string }> {
  const live = chatSocket();
  if (!live.connected) return { error: 'You are offline. Try again once you are back.' };
  try {
    const answer = (await live.timeout(10_000).emitWithAck('edit', { chatId, messageId, body })) as {
      ok?: boolean;
      message?: ChatMessage;
      error?: string;
    };
    return answer.error ? { error: answer.error } : { message: answer.message };
  } catch {
    return { error: 'It did not save. Check your connection and try again.' };
  }
}

/** Puts a changed message in place of the old one in its chat. */
export function updateMessage(client: QueryClient, message: ChatMessage) {
  client.setQueryData<ChatDetail>(chatKeys.chat(message.chatId), (chat) =>
    chat ? { ...chat, messages: chat.messages.map((m) => (m.id === message.id ? message : m)) } : chat,
  );
}

/** Adds a message to its chat in the cache, once. */
export function addMessage(client: QueryClient, message: ChatMessage) {
  client.setQueryData<ChatDetail>(chatKeys.chat(message.chatId), (chat) =>
    chat && !chat.messages.some((m) => m.id === message.id)
      ? { ...chat, messages: [...chat.messages, message] }
      : chat,
  );
}

/** Who is typing where: the time each chat last heard "typing". */
export const useTypingStore = create<{ at: Record<string, number>; set: (chatId: string) => void }>((set) => ({
  at: {},
  set: (chatId) => set((state) => ({ at: { ...state.at, [chatId]: Date.now() } })),
}));

/** "14:05" today, "Yesterday", or "18 Nov", in the viewer's own time. */
/** A message's time, as a chat shows it under each message: 14:05. */
export function messageTime(at: string): string {
  return new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** The day a message was sent, for the pill over each day's first
    message, as WhatsApp has it: Today, Yesterday, the weekday within the
    week, then the date (with the year once it is another year's). */
export function chatDay(at: string): string {
  const when = new Date(at);
  const now = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(now) - start(when)) / (24 * 60 * 60_000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return when.toLocaleDateString('en-GB', { weekday: 'long' });
  return when.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    ...(when.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

/** Whether two messages were sent on the same day. */
export function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function chatTime(at: string): string {
  const when = new Date(at);
  const now = new Date();
  const day = (d: Date) => d.toDateString();
  if (day(when) === day(now)) {
    return when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60_000);
  if (day(when) === day(yesterday)) return 'Yesterday';
  return when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
