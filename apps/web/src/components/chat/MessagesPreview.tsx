'use client';

/**
 * The newest few chats, for the Messages drop down in the header (the
 * shared UI's MessagesMenu, handed this by MessagesPreviewProvider in the
 * root layout). Laid out as the notifications in the bell's drop down: a
 * round with a store's logo, or the other side's initials, their name, the
 * last message, and when, with a clock; unread ones in bold blue with a dot.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Bone, MessagesPreviewContext } from '@snt/ui';
import { ClockIcon } from '@snt/ui/icons';
import { apiGet } from '@/lib/query';
import { chatKeys, chatTime, type ChatSummary } from '@/lib/chat';
import styles from './MessagesPreview.module.css';

/** How many it shows before See all messages. */
const SHOWN = 5;

export function MessagesPreviewProvider({ children }: { children: ReactNode }) {
  return <MessagesPreviewContext.Provider value={MessagesPreview}>{children}</MessagesPreviewContext.Provider>;
}

function MessagesPreview({ onNavigate }: { onNavigate: () => void }) {
  const list = useQuery({
    queryKey: chatKeys.list(),
    queryFn: () => apiGet<{ chats: ChatSummary[] }>('/chats'),
  });

  if (!list.data) {
    if (list.isError) return <p className={styles.none}>Your messages could not be loaded. Open them with See all messages.</p>;
    return (
      <ol className={styles.list} aria-busy>
        {Array.from({ length: 3 }, (_, n) => (
          <li key={n} className={styles.row}>
            <Bone width={36} height={36} shape="block" className={styles.avatarBone} />
            <span className={styles.body}>
              <Bone width="50%" height={12} />
              <Bone width="80%" height={11} />
            </span>
          </li>
        ))}
      </ol>
    );
  }

  const chats = list.data.chats.slice(0, SHOWN);
  if (chats.length === 0) {
    return <p className={styles.none}>No messages yet. A chat opens when you message a seller, or when an offer is accepted.</p>;
  }

  return (
    <ol className={styles.list}>
      {chats.map((chat) => (
        <li key={chat.id}>
          <Link
            href={`/messages/${chat.id}`}
            className={[styles.row, chat.unread ? styles.unread : ''].filter(Boolean).join(' ')}
            onClick={onNavigate}
          >
            {/* A store's logo, or the initials of the store or user. */}
            {chat.other.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chat.other.logo} alt="" className={[styles.avatar, styles.logo].join(' ')} />
            ) : (
              <span className={styles.avatar} aria-hidden>
                {initialsOf(chat.other.name)}
              </span>
            )}
            <span className={styles.body}>
              <span className={styles.name}>{chat.other.name}</span>
              <span className={styles.text}>
                {chat.closed
                  ? 'This chat is closed'
                  : chat.last
                    ? `${chat.last.side === chat.side ? 'You: ' : ''}${chat.last.body || 'This message was deleted'}`
                    : chat.listing.title}
              </span>
              {chat.last ? (
                <span className={styles.when}>
                  <ClockIcon size={12} weight={1.5} />
                  {chatTime(chat.last.at)}
                </span>
              ) : null}
            </span>
            {chat.unread ? <span className={styles.dot} aria-label="Unread" /> : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** "Tendai C." → "TC"; "Kopje Computers" → "KC". At most two letters. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
