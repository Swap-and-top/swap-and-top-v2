'use client';

/**
 * The list of chats (docs/features/chat.md): one white card, a line a chat,
 * newest message first: the listing's photo, the other side's name, the
 * listing, the last message and when, and how many are unread. The user's
 * own (Messages), or a store's (the Store console). Its skeleton is the same
 * card with the same lines (ChatListBones).
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bone, CountBadge } from '@snt/ui';
import { MessageIcon } from '@snt/ui/icons';
import { apiGet, QueryProblem } from '@/lib/query';
import { chatKeys, chatTime, type ChatSummary } from '@/lib/chat';
import styles from './Chat.module.css';

/** Which chats to show (the Messages page's side menu): all, those with
    unread messages, or those about a swap, a listing for sale, or a
    wanted listing, as the feed sorts listings. */
export type ChatShow = 'all' | 'unread' | 'swap' | 'sale' | 'request';

/** Whether a chat holds what was typed in a search: the other side's
    name, the listing, or the last message. */
export function chatMatches(chat: ChatSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [chat.other.name, chat.listing.title, chat.last?.body ?? ''].some((text) => text.toLowerCase().includes(q));
}

/** The choices, in order, with their names. */
export const CHAT_SHOWS: { value: ChatShow; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'swap', label: 'Swaps' },
  { value: 'sale', label: 'For sale' },
  { value: 'request', label: 'Wanted' },
];

/** Whether a chat is one to show. */
export function chatShown(chat: ChatSummary, show: ChatShow): boolean {
  if (show === 'all') return true;
  if (show === 'unread') return chat.unread > 0;
  return chat.listing.type === show;
}

/** The chats, the user's or a store's: one query, shared by the list and
    anything counting them. */
export function useChatList(storeId?: string) {
  return useQuery({
    queryKey: chatKeys.list(storeId),
    queryFn: () =>
      apiGet<{ chats: ChatSummary[] }>(`/chats${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ''}`),
  });
}

const NONE_SHOWN: Record<Exclude<ChatShow, 'all'>, string> = {
  unread: 'No unread messages. You are all caught up.',
  swap: 'No chats about swaps yet.',
  sale: 'No chats about listings for sale yet.',
  request: 'No chats about wanted listings yet.',
};

export function ChatList({
  storeId,
  hrefFor,
  show = 'all',
  query = '',
}: {
  storeId?: string;
  hrefFor: (id: string) => string;
  show?: ChatShow;
  /** What is typed in the search box over the list. */
  query?: string;
}) {
  const list = useChatList(storeId);

  if (list.isError && !list.data) return <QueryProblem error={list.error} onRetry={() => void list.refetch()} />;
  if (!list.data) return <ChatListBones />;
  const chats = list.data.chats.filter((chat) => chatShown(chat, show) && chatMatches(chat, query));
  if (chats.length === 0 && list.data.chats.length > 0 && (show !== 'all' || query.trim())) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <MessageIcon size={22} />
        </span>
        <p>{query.trim() ? 'No messages match your search.' : NONE_SHOWN[show as Exclude<ChatShow, 'all'>]}</p>
      </div>
    );
  }
  if (chats.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <MessageIcon size={22} />
        </span>
        <p>
          No messages yet. Your chats show here when you message a seller, when you accept an offer, or when someone accepts yours.
        </p>
      </div>
    );
  }
  return (
    <ul className={styles.list}>
      {chats.map((chat) => (
        <li key={chat.id}>
          <Link href={hrefFor(chat.id)} className={[styles.row, chat.unread ? styles.unread : ''].filter(Boolean).join(' ')}>
            <Thumb photo={chat.listing.photo} />
            <span className={styles.rowBody}>
              <span className={styles.rowTop}>
                <span className={styles.name}>{chat.other.name}</span>
                {chat.last ? <span className={styles.when}>{chatTime(chat.last.at)}</span> : null}
              </span>
              <span className={styles.listingTitle}>{chat.listing.title}</span>
              <span className={styles.preview}>
                {chat.closed
                  ? 'This chat is closed'
                  : chat.last
                    ? `${chat.last.side === chat.side ? 'You: ' : ''}${chat.last.body || 'This message was deleted'}`
                    : 'No messages yet'}
              </span>
            </span>
            {chat.unread ? (
              <span className={styles.rowCount}>
                <CountBadge count={chat.unread} />
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The listing's first photo, or a plain tile where it has none. */
export function Thumb({ photo }: { photo: string | null }) {
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" className={styles.thumb} />
  ) : (
    <span className={styles.thumb} aria-hidden />
  );
}

/** The list's skeleton: the same card and lines. */
export function ChatListBones() {
  return (
    <ul className={styles.list} aria-busy>
      {Array.from({ length: 5 }, (_, n) => (
        <li key={n}>
          <div className={styles.row}>
            <Bone width={48} height={48} shape="block" />
            <span className={styles.rowBody}>
              <Bone width="45%" height={14} />
              <Bone width="60%" height={12} />
              <Bone width="80%" height={12} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
