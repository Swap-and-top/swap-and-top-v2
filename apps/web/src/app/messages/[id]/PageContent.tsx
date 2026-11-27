'use client';

/**
 * One of the user's chats (components/chat/ChatView). From 768px up laid
 * out as the other pages: their chats down the left (ChatSide), headed
 * Messages, and this one to the right; on a phone the chat alone, with its
 * back arrow.
 */

import { AppHeader, Screen, ScreenBody, SignInGate } from '@snt/ui';
import { ChatSide } from '@/components/chat/ChatSide';
import { ChatView } from '@/components/chat/ChatView';
import styles from '../page.module.css';

export default function ChatPage({ id }: { id: string }) {
  return (
    <Screen>
      <div className={[styles.page, styles.chatPage].join(' ')}>
        <ChatSide openId={id} />
        <AppHeader />
        <ScreenBody>
          <SignInGate>
            <ChatView chatId={id} backHref="/messages" backPhoneOnly fill />
          </SignInGate>
        </ScreenBody>
      </div>
    </Screen>
  );
}
