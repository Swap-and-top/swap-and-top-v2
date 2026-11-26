'use client';

/**
 * MessagesButton: the way to Messages in a header, beside the bell, with how
 * many chats have unread messages in a red round, as the bell's count is.
 * Signed in only (the mark on <html>, as the bell), and not for a banned
 * account. In the console it opens the store's Messages.
 */

import Link from 'next/link';
import { useChatStore } from '@snt/core';
import { MessageIcon } from '../icons';
import { CountBadge } from '../primitives/Badge';
import styles from './Headers.module.css';

export function MessagesButton({ href, storeId }: { href: string; storeId?: string }) {
  const unread = useChatStore((state) => (storeId ? (state.storeUnread[storeId] ?? 0) : state.unread));
  return (
    <Link
      href={href}
      className={[styles.bell, storeId ? '' : styles.userBell].filter(Boolean).join(' ')}
      aria-label={unread > 0 ? `Messages, ${unread} unread` : 'Messages'}
    >
      <MessageIcon size={22} fill="currentColor" />
      <span className={styles.bellCount} aria-hidden>
        <CountBadge count={unread} />
      </span>
    </Link>
  );
}
