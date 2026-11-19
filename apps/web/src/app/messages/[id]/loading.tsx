/** A chat, while it loads: the header and the chat's skeleton. */

import { AppHeader, Screen, ScreenBody } from '@snt/ui';
import { ChatBones } from '@/components/chat/ChatView';

export default function Loading() {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <ChatBones />
      </ScreenBody>
    </Screen>
  );
}
