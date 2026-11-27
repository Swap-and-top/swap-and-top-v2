'use client';

/**
 * ChatSide: the user's chats down the left, from 768px up, in the side
 * menu's card (as the feed's categories), 280px wide and as tall as the
 * chat beside it: headed Messages, a box to find one by name, listing or
 * last message, a dropdown for All, Unread, Swaps, For sale or Wanted,
 * then each chat in
 * three lines beside its round (a store's logo or the initials): the other
 * side's name and when, the listing it is about, and the last message with
 * how many are unread. The open one is filled in the blue; a light wash
 * under the pointer, never on the open one. A click opens another chat in
 * place. On a phone it is not shown: the Messages page is the list there,
 * and a chat has its back arrow.
 */

import Link from 'next/link';
import { useState } from 'react';
import { useSessionStore } from '@snt/core';
import { Bone, Dropdown } from '@snt/ui';
import { MessageIcon, SearchIcon } from '@snt/ui/icons';
import { chatTime } from '@/lib/chat';
import { CHAT_SHOWS, chatMatches, chatShown, useChatList, type ChatShow } from './ChatList';
import { ChatAvatar } from './MessagesPreview';
import menu from '../SideMenu.module.css';
import styles from './ChatSide.module.css';

export function ChatSide({ openId }: { openId: string }) {
  // Signed out, the chat asks them to sign in; there are no chats to list.
  const signedIn = useSessionStore((state) => state.signedIn);
  return signedIn ? <ChatSideCard openId={openId} /> : null;
}

function ChatSideCard({ openId }: { openId: string }) {
  const list = useChatList();
  /** What is typed in the search box: names and listings that hold it. */
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  /** Which to show: All, Unread, or one kind of listing. */
  const [show, setShow] = useState<ChatShow>('all');
  const chats = list.data?.chats.filter((chat) => chatShown(chat, show) && chatMatches(chat, q));
  return (
    <aside className={[menu.side, styles.side].join(' ')}>
      <nav className={[menu.card, styles.card].join(' ')} aria-label="Messages">
        <Link href="/messages" className={[menu.heading, styles.heading].join(' ')}>
          <span className={menu.headingIcon} aria-hidden>
            <MessageIcon size={18} />
          </span>
          Messages
        </Link>
        <label className={styles.search}>
          <SearchIcon size={15} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search messages"
            aria-label="Search messages"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {/* All, Unread, Swaps, For sale, Wanted: one dropdown, under the
            search (a phone has these as pills). */}
        <div className={styles.filter}>
          <Dropdown<ChatShow> value={show} options={CHAT_SHOWS} onChange={setShow} />
        </div>
        {chats && chats.length === 0 && list.data?.chats.length ? (
          <p className={styles.none}>{q ? 'No messages match.' : 'None here yet.'}</p>
        ) : chats && chats.length === 0 ? (
          <p className={styles.none}>No messages yet.</p>
        ) : chats ? (
          <ul className={[menu.list, styles.list].join(' ')}>
            {chats.map((chat) => {
              const open = chat.id === openId;
              return (
                <li key={chat.id}>
                  <Link
                    href={`/messages/${chat.id}`}
                    className={[menu.item, styles.item, open ? menu.active : ''].filter(Boolean).join(' ')}
                    aria-current={open ? 'page' : undefined}
                    replace
                  >
                    <ChatAvatar other={chat.other} small />
                    {/* Three lines: who and when, the listing it is
                        about, and the last message with how many are
                        unread. */}
                    <span className={styles.lines}>
                      <span className={styles.top}>
                        <span className={styles.name}>{chat.other.name}</span>
                        {chat.last ? <span className={styles.when}>{chatTime(chat.last.at)}</span> : null}
                      </span>
                      <span className={styles.listing}>{chat.listing.title}</span>
                      <span className={styles.bottom}>
                        <span className={styles.preview}>
                          {chat.closed
                            ? 'This chat is closed'
                            : chat.last
                              ? `${chat.last.side === chat.side ? 'You: ' : ''}${chat.last.body || 'This message was deleted'}`
                              : 'No messages yet'}
                        </span>
                        {chat.unread && !open ? (
                          <span className={styles.count} aria-label={`${chat.unread} unread`}>
                            {chat.unread}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className={[menu.list, styles.list].join(' ')} aria-busy>
            {Array.from({ length: 4 }, (_, n) => (
              <li key={n} className={styles.boneRow}>
                <Bone width={28} height={28} shape="block" className={styles.boneRound} />
                <span className={styles.lines}>
                  <Bone width="70%" height={11} />
                  <Bone width="55%" height={10} />
                  <Bone width="85%" height={10} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
