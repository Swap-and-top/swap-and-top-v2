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

export function ChatList({ storeId, hrefFor }: { storeId?: string; hrefFor: (id: string) => string }) {
  const list = useQuery({
    queryKey: chatKeys.list(storeId),
    queryFn: () =>
      apiGet<{ chats: ChatSummary[] }>(`/chats${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ''}`),
  });

  if (list.isError && !list.data) return <QueryProblem error={list.error} onRetry={() => void list.refetch()} />;
  if (!list.data) return <ChatListBones />;
  const chats = list.data.chats;
  if (chats.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <MessageIcon size={22} />
        </span>
        <p>
          No messages yet. A chat opens when you message a seller who takes messages, or when an offer is accepted.
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
