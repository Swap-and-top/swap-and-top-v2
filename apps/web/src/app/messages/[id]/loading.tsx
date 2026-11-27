'use client';

/** A chat, while it loads: the page's own parts, the chats down the left
    from 768px up (ChatSide, with its own bones until they come) and the
    chat's skeleton. */

import { AppHeader, Screen, ScreenBody } from '@snt/ui';
import { ChatSide } from '@/components/chat/ChatSide';
import { ChatBones } from '@/components/chat/ChatView';
import styles from '../page.module.css';

export default function Loading() {
  return (
    <Screen>
      <div className={[styles.page, styles.chatPage].join(' ')}>
        <ChatSide openId="" />
        <AppHeader />
        <ScreenBody>
          <ChatBones backPhoneOnly fill />
        </ScreenBody>
      </div>
    </Screen>
  );
}
