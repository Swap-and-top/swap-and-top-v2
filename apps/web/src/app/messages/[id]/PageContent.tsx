'use client';

/** One of the user's chats (components/chat/ChatView). */

import { AppHeader, Screen, ScreenBody, SignInGate } from '@snt/ui';
import { ChatView } from '@/components/chat/ChatView';

export default function ChatPage({ id }: { id: string }) {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          <ChatView chatId={id} backHref="/messages" />
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
