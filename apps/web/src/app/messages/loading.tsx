/** Messages, while it loads: the header and the list's skeleton. */

import { AppHeader, Screen, ScreenBody } from '@snt/ui';
import { ChatListBones } from '@/components/chat/ChatList';
import styles from './page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>Messages</h1>
      </AppHeader>
      <ScreenBody>
        <ChatListBones />
      </ScreenBody>
    </Screen>
  );
}
