'use client';

/**
 * Messages: the user's chats, newest first (components/chat/ChatList).
 * Reached from the Messages button in the header. A store's are in the
 * Store console.
 */

import { AppHeader, Screen, ScreenBody, SignInGate } from '@snt/ui';
import { ChatList } from '@/components/chat/ChatList';
import styles from './page.module.css';

export default function MessagesPage() {
  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>Messages</h1>
      </AppHeader>
      <ScreenBody>
        <SignInGate>
          <ChatList hrefFor={(id) => `/messages/${id}`} />
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
