'use client';

/**
 * Messages. On a phone, the list of the user's chats, newest first
 * (components/chat/ChatList), with pills for All, Unread, Swaps, For sale
 * and Wanted; a tap opens a chat full screen. From 768px up it is the same
 * two panels as a chat: the chats down the left (ChatSide), and the newest
 * chat opened at once on the right; with none yet, a note there instead.
 * Reached from the Messages button in the header. A store's are in the
 * Store console.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader, Screen, ScreenBody, SignInGate } from '@snt/ui';
import { MessageIcon, SearchIcon } from '@snt/ui/icons';
import { ChatList, useChatList, type ChatShow } from '@/components/chat/ChatList';
import { ChatSide } from '@/components/chat/ChatSide';
import { ChatBones } from '@/components/chat/ChatView';
import { ChatShowPills } from './ChatShowMenu';
import styles from './page.module.css';

export default function MessagesPage() {
  /** Which chats to show, from the pills on a phone. */
  const [show, setShow] = useState<ChatShow>('all');
  /** What is typed in the search box, on a phone. */
  const [query, setQuery] = useState('');

  return (
    <Screen>
      <div className={[styles.page, styles.inbox].join(' ')}>
        <ChatSide openId="" />
        <AppHeader>
          {/* The heading with its icon on a pale tile, as in the header's
              Messages drop down. A phone's only: from 768px up the list
              down the left is headed Messages. */}
          <h1 className={styles.title}>
            <span className={styles.titleIcon} aria-hidden>
              <MessageIcon size={18} />
            </span>
            Messages
          </h1>
          {/* Find a chat by name, listing or what was said: the home
              page's search bar. */}
          <label className={styles.search}>
            <SearchIcon size={18} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search messages"
              aria-label="Search messages"
              enterKeyHint="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <ChatShowPills show={show} onShow={setShow} />
        </AppHeader>
        <ScreenBody>
          <SignInGate>
            <div className={styles.phoneOnly}>
              <ChatList hrefFor={(id) => `/messages/${id}`} show={show} query={query} />
            </div>
            <div className={styles.laptopOnly}>
              <NewestChat />
            </div>
          </SignInGate>
        </ScreenBody>
      </div>
    </Screen>
  );
}

/**
 * From 768px up, the right panel: the newest chat opened straight away
 * (the address moves to it, in place of this one), the chat's skeleton
 * until then; with no chats yet, a note.
 */
function NewestChat() {
  const router = useRouter();
  const list = useChatList();
  const newest = list.data?.chats[0]?.id;

  // Going to the newest chat is navigation, not loading: once the list is
  // in, and only where the two panels show.
  useEffect(() => {
    if (newest && window.matchMedia('(min-width: 768px)').matches) {
      router.replace(`/messages/${newest}`);
    }
  }, [newest, router]);

  if (list.data && !newest) {
    return (
      <div className={styles.noChat}>
        <span className={styles.titleIcon} aria-hidden>
          <MessageIcon size={18} />
        </span>
        <p>
          No messages yet. Your chats show here when you message a seller, when you accept an offer, or when someone
          accepts yours.
        </p>
      </div>
    );
  }
  return <ChatBones backPhoneOnly fill />;
}
