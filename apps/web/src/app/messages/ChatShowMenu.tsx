'use client';

/**
 * The Messages page's choice of chats to show on a phone: All, Unread,
 * then Swaps, For sale and Wanted, as the feed's listing types, a row of
 * pills under the heading. From 768px up the same pills are in the list
 * down the left (ChatSide).
 */

import { Chip, ChipRow } from '@snt/ui';
import { CHAT_SHOWS, type ChatShow } from '@/components/chat/ChatList';
import styles from './page.module.css';

/** On a phone: the same choices as pills. */
export function ChatShowPills({ show, onShow }: { show: ChatShow; onShow: (show: ChatShow) => void }) {
  return (
    <div className={styles.pills}>
      <ChipRow fill label="Show chats">
        {CHAT_SHOWS.map(({ value, label }) => (
          <Chip key={value} selected={show === value} onClick={() => onShow(value)}>
            {label}
          </Chip>
        ))}
      </ChipRow>
    </div>
  );
}
