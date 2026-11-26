'use client';

/**
 * MessagesButton: the way to Messages in a header, beside the bell, with how
 * many chats have unread messages in a red round, as the bell's count is.
 * Signed in only (the mark on <html>, as the bell), and not for a banned
 * account. In the marketplace it opens a drop down of the newest chats,
 * as the bell does (MessagesMenu); in the console it opens the store's
 * Messages.
 */

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useChatStore } from '@snt/core';
import { MessageIcon } from '../icons';
import { CountBadge } from '../primitives/Badge';
import { MessagesMenu, useMessagesPreview } from './MessagesMenu';
import styles from './Headers.module.css';

export function MessagesButton({ href, storeId }: { href: string; storeId?: string }) {
  const unread = useChatStore((state) => (storeId ? (state.storeUnread[storeId] ?? 0) : state.unread));
  const preview = useMessagesPreview();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const label = unread > 0 ? `Messages, ${unread} unread` : 'Messages';
  if (!storeId && preview) {
    return (
      <>
        <button
          ref={button}
          type="button"
          className={[styles.bell, styles.userBell].join(' ')}
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((now) => !now)}
        >
          <MessageIcon size={22} fill="currentColor" />
          <span className={styles.bellCount} aria-hidden>
            <CountBadge count={unread} />
          </span>
        </button>
        {open ? <MessagesMenu anchor={button.current} href={href} onClose={() => setOpen(false)} /> : null}
      </>
    );
  }
  return (
    <Link
      href={href}
      className={[styles.bell, storeId ? '' : styles.userBell].filter(Boolean).join(' ')}
      aria-label={label}
    >
      <MessageIcon size={22} fill="currentColor" />
      <span className={styles.bellCount} aria-hidden>
        <CountBadge count={unread} />
      </span>
    </Link>
  );
}
