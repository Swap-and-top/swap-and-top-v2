'use client';

/**
 * Keeps the live chat connection open while someone is signed in, and puts
 * what comes through it into TanStack Query's cache: a new message into its
 * chat, Seen onto your own messages, "typing", and the unread counts the
 * Messages buttons show (useChatStore). The counts themselves load from the
 * API, and again after anything changes them. Also gives the shared screens
 * their way to open a chat (an accepted offer's Message button).
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { connectChatOpener, useChatStore, useSessionStore } from '@snt/core';
import { addMessage, chatKeys, chatSocket, useTypingStore, type ChatDetail, type ChatMessage } from '@/lib/chat';
import { apiGet, apiSend } from '@/lib/query';

export function ChatConnection() {
  const signedIn = useSessionStore((state) => state.signedIn && state.viewer !== null);
  const banned = useSessionStore((state) => state.viewer?.standing === 'banned');
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // The header's count: chats with messages they have not read.
  const unread = useQuery({
    queryKey: chatKeys.unread(),
    queryFn: () => apiGet<{ count: number }>('/chats/unread'),
    enabled: signedIn && !banned,
  });
  useEffect(() => {
    useChatStore.getState().setUnread(unread.data?.count ?? 0);
  }, [unread.data]);

  // Open a chat from anywhere: found or started, then shown.
  useEffect(() => {
    connectChatOpener(async (from) => {
      try {
        const { id } = await apiSend<{ id: string }>('/chats', 'POST', from);
        const inConsole = window.location.pathname.startsWith('/console');
        router.push(inConsole ? `/console/messages/${id}` : `/messages/${id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'We could not open the chat. Try again.');
      }
    });
  }, [router]);

  // The live connection, while signed in. Not loading: listening.
  useEffect(() => {
    if (!signedIn || banned) return;
    const live = chatSocket();
    const refreshCounts = () => void client.invalidateQueries({ queryKey: chatKeys.all, exact: false, refetchType: 'active' });
    const onMessage = (message: ChatMessage) => {
      addMessage(client, message);
      void client.invalidateQueries({ queryKey: ['chats', 'list'] });
      void client.invalidateQueries({ queryKey: ['chats', 'unread'] });
    };
    const onRead = ({ chatId, by, at }: { chatId: string; by: string; at: string }) => {
      // The other side read ours: Seen on every message of ours not yet.
      client.setQueryData<ChatDetail>(chatKeys.chat(chatId), (chat) =>
        chat
          ? { ...chat, messages: chat.messages.map((m) => (m.side !== by && !m.readAt ? { ...m, readAt: at } : m)) }
          : chat,
      );
    };
    const onReadMine = () => {
      void client.invalidateQueries({ queryKey: ['chats', 'unread'] });
      void client.invalidateQueries({ queryKey: ['chats', 'list'] });
    };
    const onTyping = ({ chatId }: { chatId: string }) => useTypingStore.getState().set(chatId);
    // Back after a gap: anything missed is read again.
    const onReconnect = () => refreshCounts();
    live.on('message', onMessage);
    live.on('read', onRead);
    live.on('read-mine', onReadMine);
    live.on('typing', onTyping);
    live.io.on('reconnect', onReconnect);
    live.connect();
    return () => {
      live.off('message', onMessage);
      live.off('read', onRead);
      live.off('read-mine', onReadMine);
      live.off('typing', onTyping);
      live.io.off('reconnect', onReconnect);
      live.disconnect();
    };
  }, [signedIn, banned, client]);

  // Leaving a chat's page: this device is no longer looking at it.
  useEffect(() => {
    if (!/\/messages\/[^/]+$/.test(pathname)) chatSocket().emit('close');
  }, [pathname]);

  return null;
}

/** A store's count for the console's Messages button, while it is open. */
export function StoreChatUnread({ storeId }: { storeId: string }) {
  const unread = useQuery({
    queryKey: chatKeys.unread(storeId),
    queryFn: () => apiGet<{ count: number }>(`/chats/unread?storeId=${encodeURIComponent(storeId)}`),
  });
  useEffect(() => {
    useChatStore.getState().setUnread(unread.data?.count ?? 0, storeId);
  }, [unread.data, storeId]);
  return null;
}
