'use client';

/**
 * A store's chats, in the Store console: about its listings, or offers it
 * sent. Any member reads and replies as the store. Opened from the Messages
 * button beside the console's bell.
 */

import { ConsoleShell, useConsoleTarget } from '@snt/ui';
import { currentStore } from '@snt/core';
import { ChatList } from '@/components/chat/ChatList';

export default function ConsoleMessagesPage() {
  const store = useConsoleTarget() ?? currentStore;
  return (
    <ConsoleShell store={store} title="Messages" meta="Chats with buyers, newest first">
      <ChatList storeId={store.id} hrefFor={(id) => `/console/messages/${id}`} />
    </ConsoleShell>
  );
}
