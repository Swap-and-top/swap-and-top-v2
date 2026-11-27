'use client';

/** Messages, while it loads: the page's own parts. On a phone its heading,
    pills on All and the list's skeleton; from 768px up the list down the
    left (ChatSide, with its own bones until it comes) and a chat's
    skeleton on the right. */

import { AppHeader, Screen, ScreenBody } from '@snt/ui';
import { MessageIcon } from '@snt/ui/icons';
import { ChatListBones } from '@/components/chat/ChatList';
import { ChatSide } from '@/components/chat/ChatSide';
import { ChatBones } from '@/components/chat/ChatView';
import { ChatShowPills } from './ChatShowMenu';
import styles from './page.module.css';

export default function Loading() {
  return (
    <Screen>
      <div className={[styles.page, styles.inbox].join(' ')}>
        <ChatSide openId="" />
        <AppHeader>
          <h1 className={styles.title}>
            <span className={styles.titleIcon} aria-hidden>
              <MessageIcon size={18} />
            </span>
            Messages
          </h1>
          <ChatShowPills show="all" onShow={() => {}} />
        </AppHeader>
        <ScreenBody>
          <div className={styles.phoneOnly}>
            <ChatListBones />
          </div>
          <div className={styles.laptopOnly}>
            <ChatBones backPhoneOnly fill />
          </div>
        </ScreenBody>
      </div>
    </Screen>
  );
}
