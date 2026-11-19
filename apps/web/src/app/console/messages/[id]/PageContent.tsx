'use client';

/** One of a store's chats, in the Store console (components/chat/ChatView). */

import { ConsoleShell, useConsoleTarget } from '@snt/ui';
import { currentStore } from '@snt/core';
import { ChatView } from '@/components/chat/ChatView';

export default function ConsoleChatPage({ id }: { id: string }) {
  const store = useConsoleTarget() ?? currentStore;
  return (
    <ConsoleShell store={store} title="Messages">
      <ChatView chatId={id} backHref="/console/messages" />
    </ConsoleShell>
  );
}
