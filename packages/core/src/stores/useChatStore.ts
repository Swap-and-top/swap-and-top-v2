/**
 * Chat, as the shared screens see it (docs/features/chat.md): how many chats
 * have unread messages (the header's Messages count, and a store's in the
 * console), and how to open one. The web app fills both (lib/chat.ts):
 * the counts from the API and the live chat, and `open` as the call that
 * finds or starts a chat and goes to it.
 */

import { create } from 'zustand';

export interface ChatStore {
  /** The signed in user's chats with unread messages. */
  unread: number;
  /** Each store's, by its id, for the console. */
  storeUnread: Record<string, number>;
  setUnread: (count: number, storeId?: string) => void;
  /** Opens the chat for an accepted offer, or a listing's Message: finds
      or starts it and goes there. Set by the web app. */
  open: (from: { offerId?: string; listingId?: string }) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set) => ({
  unread: 0,
  storeUnread: {},
  setUnread: (count, storeId) =>
    set((state) =>
      storeId ? { storeUnread: { ...state.storeUnread, [storeId]: count } } : { unread: count },
    ),
  open: async () => undefined,
}));

/** The web app's way of opening a chat. */
export function connectChatOpener(open: ChatStore['open']) {
  useChatStore.setState({ open });
}
