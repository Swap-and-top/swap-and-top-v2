'use client';

/**
 * A reported chat, for Trust and safety (GET /api/staff/chats/{id}): only a
 * chat a report names, and each look is logged in the Activity log. Each
 * message with who sent it and when, oldest first, as a sheet over the
 * report.
 */

import { useQuery } from '@tanstack/react-query';
import { Bone, Sheet, Stack } from '@snt/ui';
import { apiGet, QueryProblem } from '@/lib/query';
import { chatTime, type ChatMessage } from '@/lib/chat';
import styles from './Chat.module.css';

interface Transcript {
  from: { name: string };
  owner: { name: string };
  listing: { slug: string; title: string; photo: string | null };
  messages: ChatMessage[];
}

export function ChatTranscript({ chatId, onClose }: { chatId: string; onClose: () => void }) {
  const chat = useQuery({
    queryKey: ['staff', 'chat', chatId],
    queryFn: () => apiGet<Transcript>(`/staff/chats/${encodeURIComponent(chatId)}`),
    // Each opening is a look, logged: read once while the sheet is open.
    staleTime: Infinity,
    gcTime: 0,
  });
  const data = chat.data;
  return (
    <Sheet title="The reported chat" onClose={onClose}>
      {chat.isError && !data ? (
        <QueryProblem error={chat.error} onRetry={() => void chat.refetch()} />
      ) : !data ? (
        <Stack gap={4}>
          <Bone width="60%" height={14} />
          {[70, 50, 65].map((width, n) => (
            <Bone key={n} width={`${width}%`} height={44} shape="block" />
          ))}
        </Stack>
      ) : (
        <div className={styles.messages}>
          <p className={styles.safety}>
            {data.from.name} and {data.owner.name}, about {data.listing.title}. Opening this chat is logged.
          </p>
          {data.messages.length === 0 ? <p className={styles.firstNote}>No messages in this chat.</p> : null}
          {data.messages.map((message) => (
            <div
              key={message.id}
              className={[styles.bubbleRow, message.side === 'owner' ? styles.mine : ''].filter(Boolean).join(' ')}
            >
              <span className={styles.seen}>{message.side === 'from' ? data.from.name : data.owner.name}</span>
              <div className={styles.bubble}>
                <p className={styles.bubbleText}>{message.body}</p>
                <span className={styles.bubbleTime}>{chatTime(message.at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
