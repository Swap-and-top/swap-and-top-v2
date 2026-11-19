'use client';

/**
 * One chat (docs/features/chat.md): the listing at the top, a safety note,
 * the messages (yours on the right in the blue, theirs on the left), Seen
 * under your last read one, "typing…" while they type, and a box with Send
 * at the foot. Its menu: Report this chat, and Block or Unblock. Closed (a
 * ban or a block), the box gives way to a line saying so.
 *
 * Loaded from the API with TanStack Query; new messages, Seen and typing
 * come through the live connection (lib/chat.ts, ChatConnection).
 */

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Bone, Button, Sheet, Stack } from '@snt/ui';
import { ChevronLeftIcon, MoreIcon } from '@snt/ui/icons';
import { ReportSheet } from '@/components/ReportSheet';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import {
  addMessage,
  chatKeys,
  chatSocket,
  chatTime,
  sendChatMessage,
  useTypingStore,
  type ChatDetail,
  type ChatMessage,
} from '@/lib/chat';
import { Thumb } from './ChatList';
import styles from './Chat.module.css';

/** "typing…" shows this long after the last sign of it. */
const TYPING_MS = 4000;

export function ChatView({ chatId, backHref }: { chatId: string; backHref: string }) {
  const client = useQueryClient();
  const chat = useQuery({
    queryKey: chatKeys.chat(chatId),
    queryFn: () => apiGet<ChatDetail>(`/chats/${encodeURIComponent(chatId)}`),
  });
  const data = chat.data;
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const lastTyping = useRef(0);

  // This device is looking at the chat: no notification for it, and what
  // they sent is Seen. Not loading: telling the live chat.
  useEffect(() => {
    const live = chatSocket();
    const open = () => live.emit('open', { chatId });
    open();
    live.on('connect', open);
    return () => {
      live.off('connect', open);
      live.emit('close');
    };
  }, [chatId]);

  const lastTheirs = data?.messages.filter((m) => m.side !== data.side).at(-1);
  useEffect(() => {
    if (!lastTheirs || lastTheirs.readAt) return;
    chatSocket().emit('read', { chatId }, () => {
      void client.invalidateQueries({ queryKey: ['chats', 'unread'] });
      void client.invalidateQueries({ queryKey: ['chats', 'list'] });
    });
  }, [lastTheirs, chatId, client]);

  // The newest message in view, as each one comes.
  const count = data?.messages.length ?? 0;
  useLayoutEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [count]);

  // "typing…": shown while it is fresh, then gone by itself.
  const typingAt = useTypingStore((state) => state.at[chatId] ?? 0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!typingAt) return;
    setNow(Date.now());
    const timer = window.setTimeout(() => setNow(Date.now()), TYPING_MS + 100);
    return () => window.clearTimeout(timer);
  }, [typingAt]);
  const typing = typingAt > 0 && now - typingAt < TYPING_MS;

  // Shown at once, marked Sending, then swapped for the saved message; on
  // a slow connection the chat never looks stuck.
  const send = useMutation({
    mutationFn: async ({ body }: { body: string; pendingId: string }) => {
      const { message, error } = await sendChatMessage(chatId, body);
      if (error || !message) throw new Error(error ?? 'It did not send. Try again.');
      return message;
    },
    onMutate: ({ body, pendingId }) => {
      setText('');
      client.setQueryData<ChatDetail>(chatKeys.chat(chatId), (current) =>
        current
          ? {
              ...current,
              messages: [
                ...current.messages,
                { id: pendingId, chatId, body, side: current.side, at: new Date().toISOString(), readAt: null },
              ],
            }
          : current,
      );
    },
    onSuccess: (message: ChatMessage, { pendingId }) => {
      client.setQueryData<ChatDetail>(chatKeys.chat(chatId), (current) =>
        current ? { ...current, messages: current.messages.filter((m) => m.id !== pendingId) } : current,
      );
      addMessage(client, message);
      void client.invalidateQueries({ queryKey: ['chats', 'list'] });
    },
    onError: (error, { body, pendingId }) => {
      client.setQueryData<ChatDetail>(chatKeys.chat(chatId), (current) =>
        current ? { ...current, messages: current.messages.filter((m) => m.id !== pendingId) } : current,
      );
      setText((typed) => typed || body);
      toast.error(error.message);
    },
  });

  const older = useMutation({
    mutationFn: () =>
      apiGet<{ messages: ChatMessage[]; more: boolean }>(
        `/chats/${encodeURIComponent(chatId)}/messages?before=${encodeURIComponent(data!.messages[0]!.at)}`,
      ),
    onSuccess: (page) =>
      client.setQueryData<ChatDetail>(chatKeys.chat(chatId), (current) =>
        current ? { ...current, messages: [...page.messages, ...current.messages], more: page.more } : current,
      ),
    onError: (error) => toast.error(error.message),
  });

  const block = useMutation({
    mutationFn: (on: boolean) => apiSend(`/chats/${encodeURIComponent(chatId)}/block`, 'PUT', { block: on }),
    onSuccess: (_, on) => {
      toast.success(on ? `${data?.other.name ?? 'They'} can no longer message you.` : 'Unblocked. You can message each other again.');
      setMenu(false);
      void client.invalidateQueries({ queryKey: chatKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });

  if (chat.isError && !data) return <QueryProblem error={chat.error} onRetry={() => void chat.refetch()} />;
  if (!data) return <ChatBones />;

  const body = text.trim();
  const submit = () => {
    if (body) send.mutate({ body, pendingId: `pending-${Date.now()}` });
  };
  /** Your last message the other side has read: Seen goes under it. */
  const seenId = data.messages.filter((m) => m.side === data.side && m.readAt).at(-1)?.id;

  return (
    <div className={styles.chat}>
      <div className={styles.chatTop}>
        <Link href={backHref} className={styles.round} aria-label="Back to messages">
          <ChevronLeftIcon size={20} />
        </Link>
        <h1 className={styles.chatName}>{data.other.name}</h1>
        <button type="button" className={styles.round} aria-label="Chat options" onClick={() => setMenu(true)}>
          <MoreIcon size={20} />
        </button>
      </div>

      <Link href={`/listing/${data.listing.slug}`} className={styles.chatListing}>
        <Thumb photo={data.listing.photo} />
        <span className={styles.chatListingTitle}>{data.listing.title}</span>
      </Link>

      <div className={styles.messages}>
        <p className={styles.safety}>Meet in public, and check the item before you pay. Never pay before you have seen it.</p>
        {data.more ? (
          <Button variant="secondary" size="sm" loading={older.isPending} onClick={() => older.mutate()}>
            Show earlier messages
          </Button>
        ) : null}
        {data.messages.length === 0 ? <p className={styles.firstNote}>Say hello to start the chat.</p> : null}
        {data.messages.map((message) => {
          const mine = message.side === data.side;
          return (
            <div key={message.id} className={[styles.bubbleRow, mine ? styles.mine : ''].filter(Boolean).join(' ')}>
              <div className={styles.bubble}>
                <p className={[styles.bubbleText, message.body ? '' : styles.deleted].filter(Boolean).join(' ')}>
                  {message.body || 'This message was deleted'}
                </p>
                <span className={styles.bubbleTime}>
                  {message.id.startsWith('pending-') ? 'Sending…' : chatTime(message.at)}
                </span>
              </div>
              {message.id === seenId ? <span className={styles.seen}>Seen</span> : null}
            </div>
          );
        })}
        {typing ? <p className={styles.typing}>{data.other.name} is typing…</p> : null}
        <div ref={bottom} />
      </div>

      {data.closed ? (
        <div className={styles.closed}>
          {data.blockedByMe ? (
            <>
              <p>You blocked {data.other.name}. Unblock them to message each other again.</p>
              <Button variant="secondary" size="sm" loading={block.isPending} onClick={() => block.mutate(false)}>
                Unblock
              </Button>
            </>
          ) : (
            <p>This chat is closed. You can no longer send messages here.</p>
          )}
        </div>
      ) : (
        <div className={styles.composer}>
          <textarea
            className={styles.input}
            rows={1}
            maxLength={2000}
            placeholder="Message"
            aria-label="Your message"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              // At most every 2 seconds, so the other side sees "typing…".
              if (Date.now() - lastTyping.current > 2000) {
                lastTyping.current = Date.now();
                chatSocket().emit('typing', { chatId });
              }
            }}
            onKeyDown={(event) => {
              // Enter sends on a laptop; Shift and Enter for a new line.
              if (event.key === 'Enter' && !event.shiftKey && window.matchMedia('(hover: hover)').matches) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <Button size="md" disabled={!body} onClick={submit}>
            Send
          </Button>
        </div>
      )}

      {menu ? (
        <Sheet narrow title="Chat options" onClose={() => setMenu(false)}>
          <Stack gap={4}>
            <Button
              variant="secondary"
              size="lg"
              block
              onClick={() => {
                setMenu(false);
                setReporting(true);
              }}
            >
              Report this chat
            </Button>
            <Button
              variant="secondary"
              size="lg"
              block
              loading={block.isPending}
              onClick={() => block.mutate(!data.blockedByMe)}
            >
              {data.blockedByMe ? `Unblock ${data.other.name}` : `Block ${data.other.name}`}
            </Button>
            <Button variant="secondary" size="lg" block onClick={() => setMenu(false)}>
              Cancel
            </Button>
          </Stack>
        </Sheet>
      ) : null}
      {reporting ? <ReportSheet chatId={chatId} name={data.other.name} onClose={() => setReporting(false)} /> : null}
    </div>
  );
}

/** The chat's skeleton: the same top, listing strip, bubbles and box. */
export function ChatBones() {
  return (
    <div className={styles.chat} aria-busy>
      <div className={styles.chatTop}>
        <Bone width={36} height={36} shape="circle" />
        <Bone width={110} height={18} style={{ justifySelf: 'center' }} />
        <Bone width={36} height={36} shape="circle" />
      </div>
      <div className={styles.chatListing}>
        <Bone width={48} height={48} shape="block" />
        <Bone width="50%" height={14} />
      </div>
      <div className={styles.messages}>
        <Bone width="100%" height={36} shape="block" />
        {[60, 45, 70, 40].map((width, n) => (
          <div key={n} className={[styles.bubbleRow, n % 2 ? styles.mine : ''].filter(Boolean).join(' ')}>
            <Bone width={`${width}%`} height={44} shape="block" />
          </div>
        ))}
      </div>
      <div className={styles.composer}>
        <Bone width="100%" height={44} shape="pill" />
        <Bone width={84} height={40} shape="pill" />
      </div>
    </div>
  );
}
