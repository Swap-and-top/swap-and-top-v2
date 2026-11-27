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
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Bone, Button, Sheet } from '@snt/ui';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  MoreIcon,
  PersonIcon,
  ReportIcon,
  SendIcon,
  SettingsIcon,
  ShieldIcon,
  StorefrontIcon,
} from '@snt/ui/icons';
import { ReportSheet } from '@/components/ReportSheet';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import {
  addMessage,
  chatKeys,
  chatSocket,
  chatDay,
  EDIT_WINDOW_MS,
  editChatMessage,
  messageTime,
  sameDay,
  sendChatMessage,
  updateMessage,
  useTypingStore,
  type ChatDetail,
  type ChatMessage,
} from '@/lib/chat';
import { Thumb } from './ChatList';
import styles from './Chat.module.css';

/** "typing…" shows this long after the last sign of it. */
const TYPING_MS = 4000;

export function ChatView({
  chatId,
  backHref,
  backPhoneOnly = false,
  fill = false,
}: {
  chatId: string;
  backHref: string;
  /** The back arrow on a phone only: from 768px up the chats are down the
      left (ChatSide), so there is nothing to go back to. */
  backPhoneOnly?: boolean;
  /** As tall as the screen leaves room for, the messages scrolling inside
      and the box to write in always at the foot, as chat apps have it
      (the user's chat page). */
  fill?: boolean;
}) {
  const client = useQueryClient();
  const chat = useQuery({
    queryKey: chatKeys.chat(chatId),
    queryFn: () => apiGet<ChatDetail>(`/chats/${encodeURIComponent(chatId)}`),
  });
  const data = chat.data;
  const [text, setText] = useState('');
  /** The message tapped: its Reply (and, if yours and fresh, Edit) show under it. */
  const [picked, setPicked] = useState<string | null>(null);
  /** A long press on a phone: its timer, and whether it fired. */
  const press = useRef<number | undefined>(undefined);
  const pressed = useRef(false);
  /** Whether the last press on a message was a finger (not a mouse). */
  const byTouch = useRef(false);
  useEffect(() => () => window.clearTimeout(press.current), []);
  // A tap anywhere but the chosen message itself and its Reply and Edit
  // (even beside it, on its row) lets go of it. A listener, not loading.
  useEffect(() => {
    if (!picked) return;
    const away = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.('[data-picked]')) return;
      setPicked(null);
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [picked]);
  /** The message being answered: quoted over the box until sent. */
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  /** Your message being changed: its words in the box until saved. */
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const lastTyping = useRef(0);
  /** The box to write in, and its own blue scroll bar while it is taller
      than it shows: where the bar sits and how long it is. */
  const input = useRef<HTMLTextAreaElement>(null);
  const [inputBar, setInputBar] = useState<{ top: number; height: number } | null>(null);
  /** Which bar is showing: each only while its part scrolls, fading out
      2 seconds after it stops. */
  const [barShown, setBarShown] = useState<'input' | 'middle' | null>(null);
  const barTimer = useRef<number | undefined>(undefined);
  function showBar(which: 'input' | 'middle') {
    setBarShown(which);
    window.clearTimeout(barTimer.current);
    barTimer.current = window.setTimeout(() => setBarShown(null), 2000);
  }
  useEffect(() => () => window.clearTimeout(barTimer.current), []);
  function followInput() {
    const el = input.current;
    if (!el) return;
    const room = el.clientHeight;
    const whole = el.scrollHeight;
    if (whole <= room + 1) {
      setInputBar(null);
      return;
    }
    /** Clear of the box's rounded ends. */
    const inset = 10;
    const track = room - inset * 2;
    const height = Math.max(16, (track * room) / whole);
    setInputBar({ top: inset + ((track - height) * el.scrollTop) / (whole - room), height });
  }
  useLayoutEffect(followInput, [text]);

  /** The middle of the chat (the listing, the note and the messages, which
      scroll together on the user's chat page), and its own blue bar. */
  const middle = useRef<HTMLDivElement>(null);
  /** What scrolls in it: stretched at the top and bottom (useEdgeStretch). */
  const middleInner = useRef<HTMLDivElement>(null);
  // Once the chat has come and is on screen.
  useEdgeStretch(middle, middleInner, fill && Boolean(data) && !chat.isError);
  const [middleBar, setMiddleBar] = useState<{ top: number; height: number } | null>(null);
  function followMiddle() {
    const el = middle.current;
    if (!el || !fill) return;
    const room = el.clientHeight;
    const whole = el.scrollHeight;
    if (whole <= room + 1) {
      setMiddleBar(null);
      return;
    }
    /** Clear of the card's rounded corners. */
    const inset = 10;
    const track = room - inset * 2;
    const height = Math.max(28, (track * room) / whole);
    // Outside the scrolling part, beside it: from where its inside starts.
    setMiddleBar({ top: el.offsetTop + el.clientTop + inset + ((track - height) * el.scrollTop) / (whole - room), height });
  }

  // On the user's chat page, the chat is as tall as the part of the screen
  // that shows: when a phone's keyboard opens, the chat shrinks to sit on
  // top of it, the box to write in just above the keys and the messages
  // still scrolling on their own. A listener, not loading.
  useEffect(() => {
    if (!fill) return;
    const view = window.visualViewport;
    if (!view) return;
    const root = document.documentElement;
    const fit = () => {
      root.style.setProperty('--chat-vh', `${view.height}px`);
      // Kept at the top: a phone may scroll the page to show the box.
      if (window.scrollY) window.scrollTo(0, 0);
      bottom.current?.scrollIntoView({ block: 'end' });
      followMiddle();
    };
    // The page itself never moves while a chat is open, keyboard or not:
    // only the messages scroll. A swipe outside them does nothing, and if
    // the phone slides the page anyway, it goes straight back.
    const before = { overflow: root.style.overflow, overscroll: root.style.overscrollBehavior };
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    const stayPut = () => {
      if (window.scrollY) window.scrollTo(0, 0);
    };
    fit();
    view.addEventListener('resize', fit);
    view.addEventListener('scroll', stayPut);
    window.addEventListener('scroll', stayPut, { passive: true });
    return () => {
      view.removeEventListener('resize', fit);
      view.removeEventListener('scroll', stayPut);
      window.removeEventListener('scroll', stayPut);
      root.style.removeProperty('--chat-vh');
      root.style.overflow = before.overflow;
      root.style.overscrollBehavior = before.overscroll;
    };
  }, [fill]);

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

  /** Whether they are at (or near) the bottom of the chat: only then does
      it follow new messages and the typing dots. Scrolled up to read, they
      stay where they are. Always so where the chat does not scroll on its
      own (the Store console). */
  const atBottom = useRef(true);
  const [away, setAway] = useState(false);
  /** New messages from the other side that came while they were away from
      the bottom: on the button that takes them down. */
  const [unseen, setUnseen] = useState(0);
  function followBottom() {
    const el = middle.current;
    if (!el || !fill) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    atBottom.current = near;
    setAway(!near);
    if (near) setUnseen(0);
  }
  /** Down to the newest message. */
  const toBottom = (smooth = false) => {
    bottom.current?.scrollIntoView({ block: 'end', behavior: smooth ? 'smooth' : 'auto' });
    setUnseen(0);
  };

  // A new message at the bottom: into view if they are there, or it is
  // their own; otherwise counted on the button. Older ones loaded above do
  // not count.
  const last = data?.messages.at(-1);
  const lastSeenId = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (!last) return;
    const first = lastSeenId.current === undefined;
    if (last.id === lastSeenId.current) return;
    lastSeenId.current = last.id;
    if (first || atBottom.current || last.side === data?.side) toBottom();
    else setUnseen((n) => n + 1);
    followMiddle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last?.id]);

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
  useLayoutEffect(() => {
    if (typing && atBottom.current) bottom.current?.scrollIntoView({ block: 'end' });
  }, [typing]);

  // Shown at once, marked Sending, then swapped for the saved message; on
  // a slow connection the chat never looks stuck.
  const send = useMutation({
    mutationFn: async ({ body, answering }: { body: string; pendingId: string; answering?: ChatMessage | null }) => {
      const { message, error } = await sendChatMessage(chatId, body, answering?.id);
      if (error || !message) throw new Error(error ?? 'It did not send. Try again.');
      return message;
    },
    onMutate: ({ body, pendingId, answering }) => {
      setText('');
      setReplyTo(null);
      client.setQueryData<ChatDetail>(chatKeys.chat(chatId), (current) =>
        current
          ? {
              ...current,
              messages: [
                ...current.messages,
                {
                  id: pendingId,
                  chatId,
                  body,
                  side: current.side,
                  at: new Date().toISOString(),
                  readAt: null,
                  replyTo: answering ? { id: answering.id, body: answering.body, side: answering.side } : null,
                  editedAt: null,
                },
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

  // Saving a change: shown at once, then the saved one; put back on failure.
  const change = useMutation({
    mutationFn: async ({ message, body }: { message: ChatMessage; body: string }) => {
      const answer = await editChatMessage(chatId, message.id, body);
      if (answer.error || !answer.message) throw new Error(answer.error ?? 'It did not save. Try again.');
      return answer.message;
    },
    onMutate: ({ message, body }) => {
      setText('');
      setEditing(null);
      updateMessage(client, { ...message, body, editedAt: new Date().toISOString() });
    },
    onSuccess: (message) => {
      updateMessage(client, message);
      void client.invalidateQueries({ queryKey: ['chats', 'list'] });
    },
    onError: (error, { message }) => {
      updateMessage(client, message);
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
  if (!data) return <ChatBones backPhoneOnly={backPhoneOnly} fill={fill} />;

  const body = text.trim();
  const submit = () => {
    if (!body) return;
    if (editing) change.mutate({ message: editing, body });
    else send.mutate({ body, pendingId: `pending-${Date.now()}`, answering: replyTo });
  };
  /** Answer a message, or change one of yours: its words in the box. */
  const answer = (message: ChatMessage) => {
    setEditing(null);
    setReplyTo(message);
    setPicked(null);
    input.current?.focus();
  };
  const startEdit = (message: ChatMessage) => {
    setReplyTo(null);
    setEditing(message);
    setText(message.body);
    setPicked(null);
    input.current?.focus();
  };
  const stopComposing = () => {
    if (editing) setText('');
    setEditing(null);
    setReplyTo(null);
  };
  /** Who sent a message, as a quote names them. */
  const whoSent = (side: string) => (side === data.side ? 'You' : data.other.name);
  /** Your last message the other side has read: Seen goes under it. */
  const seenId = data.messages.filter((m) => m.side === data.side && m.readAt).at(-1)?.id;

  return (
    <div className={[styles.chat, fill ? styles.chatFill : ''].filter(Boolean).join(' ')}>
      <div className={styles.chatTop}>
        <Link
          href={backHref}
          className={[styles.round, backPhoneOnly ? styles.phoneOnly : ''].filter(Boolean).join(' ')}
          aria-label="Back to messages"
        >
          <ChevronLeftIcon size={20} />
        </Link>
        {/* Who it is with: a store's logo, a shop for a store without one,
            or a person. */}
        <h1 className={styles.chatName}>
          {data.other.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.other.logo} alt="" className={styles.chatFace} />
          ) : (
            <span className={styles.chatFace} aria-hidden>
              {data.other.store ? <StorefrontIcon size={14} /> : <PersonIcon size={14} />}
            </span>
          )}
          <span className={styles.chatNameLines}>
            <span className={styles.chatNameText}>{data.other.name}</span>
            {/* Scrolled up, where the dots are out of sight: said here. */}
            {typing && away ? <span className={styles.chatTyping}>typing…</span> : null}
          </span>
        </h1>
        <button type="button" className={styles.round} aria-label="Chat options" onClick={() => setMenu(true)}>
          <MoreIcon size={20} />
        </button>
      </div>

      {/* The middle: the listing and the messages. On a phone's chat page
          the only white card, the name above it and the box below it on
          the page. */}
      <div className={styles.middleWrap}>
      <div
        ref={middle}
        className={styles.chatBody}
        onScroll={() => {
          followMiddle();
          followBottom();
          showBar('middle');
        }}
      >
      <div ref={middleInner} className={styles.chatInner}>
      {/* The listing it is about: its photo, its name, its kind and price
          as a badge, and plainly a way to it. */}
      <Link href={`/listing/${data.listing.slug}`} className={styles.chatListing}>
        <Thumb photo={data.listing.photo} />
        <span className={styles.chatListingText}>
          <span className={styles.chatListingTitle}>{data.listing.title}</span>
          {data.listing.terms ? <span className={styles.terms}>{data.listing.terms}</span> : null}
        </span>
        <span className={styles.viewListing}>
          View listing
          <ChevronRightIcon size={16} />
        </span>
      </Link>

      <div className={styles.messages}>
        <p className={styles.safety}>Meet in public, and check the item before you pay. Never pay before you have seen it.</p>
        {data.closesAt ? (
          <p className={styles.soldNote}>
            This listing is sold. This chat closes on {closingTime(data.closesAt)}.
          </p>
        ) : null}
        {data.more ? (
          <Button variant="secondary" size="sm" loading={older.isPending} onClick={() => older.mutate()}>
            Show earlier messages
          </Button>
        ) : null}
        {data.messages.length === 0 ? <p className={styles.firstNote}>Say hello to start the chat.</p> : null}
        {data.messages.map((message, n) => {
          const mine = message.side === data.side;
          const pending = message.id.startsWith('pending-');
          /** The first of its day: a pill with the day over it. */
          const before = data.messages[n - 1];
          const newDay = !before || !sameDay(before.at, message.at);
          return (
            <Fragment key={message.id}>
              {newDay ? (
                <p className={styles.dayPill}>
                  <span>{chatDay(message.at)}</span>
                </p>
              ) : null}
              <div className={[styles.bubbleRow, mine ? styles.mine : ''].filter(Boolean).join(' ')}>
                {/* A long press on a phone (a click with a mouse) shows Reply,
                    and Edit on yours within 15 minutes. */}
                <div
                  className={[styles.bubble, picked === message.id ? styles.bubblePicked : ''].filter(Boolean).join(' ')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={picked === message.id}
                  data-picked={picked === message.id ? '' : undefined}
                  onPointerDown={(event) => {
                    byTouch.current = event.pointerType === 'touch';
                    if (!byTouch.current || pending || data.closed) return;
                    window.clearTimeout(press.current);
                    press.current = window.setTimeout(() => {
                      pressed.current = true;
                      setPicked(message.id);
                      navigator.vibrate?.(10);
                    }, LONG_PRESS_MS);
                  }}
                  onPointerUp={() => window.clearTimeout(press.current)}
                  onPointerLeave={() => window.clearTimeout(press.current)}
                  onPointerCancel={() => window.clearTimeout(press.current)}
                  // A long press does not open the phone's own menu.
                  onContextMenu={(event) => {
                    if (pressed.current) event.preventDefault();
                  }}
                  onClick={() => {
                    // After a long press, the tap that ends it does nothing.
                    if (pressed.current) {
                      pressed.current = false;
                      return;
                    }
                    // A tap on a phone does nothing; a click with a mouse picks.
                    if (byTouch.current) return;
                    if (pending || data.closed) return;
                    setPicked((now) => (now === message.id ? null : message.id));
                  }}
                  onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && !pending && !data.closed) {
                      event.preventDefault();
                      setPicked((now) => (now === message.id ? null : message.id));
                    }
                  }}
                >
                  {message.replyTo ? (
                    <span className={styles.quote}>
                      <span className={styles.quoteWho}>{whoSent(message.replyTo.side)}</span>
                      <span className={styles.quoteText}>{message.replyTo.body}</span>
                    </span>
                  ) : null}
                  <p className={[styles.bubbleText, message.body ? '' : styles.deleted].filter(Boolean).join(' ')}>
                    {message.body || 'This message was deleted'}
                  </p>
                  <span className={styles.bubbleTime}>
                    {pending ? 'Sending…' : messageTime(message.at)}
                    {message.editedAt ? ' · Edited' : ''}
                  </span>
                </div>
                {picked === message.id ? (
                  <div className={styles.msgActions} data-picked="">
                    <button type="button" className={styles.msgAction} onClick={() => answer(message)}>
                      Reply
                    </button>
                    {mine && Date.now() - new Date(message.at).getTime() < EDIT_WINDOW_MS ? (
                      <button type="button" className={styles.msgAction} onClick={() => startEdit(message)}>
                        Edit
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {message.id === seenId ? <span className={styles.seen}>Seen</span> : null}
              </div>
            </Fragment>
          );
        })}
        {/* They are typing: three dots rising one after another in a small
            bubble of theirs. */}
        {typing ? (
          <div className={styles.bubbleRow}>
            <div className={styles.typingBubble} role="status" aria-label={`${data.other.name} is typing`}>
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
        <div ref={bottom} />
      </div>
      </div>
      </div>
      {fill && unseen > 0 ? (
        <button type="button" className={styles.newMessages} onClick={() => toBottom(true)}>
          {unseen === 1 ? '1 new message' : `${unseen} new messages`}
          <ChevronRightIcon size={14} className={styles.newMessagesArrow} />
        </button>
      ) : null}
      {middleBar ? (
        <span
          className={[styles.middleBar, barShown === 'middle' ? styles.barShown : ''].filter(Boolean).join(' ')}
          style={{ top: middleBar.top, height: middleBar.height }}
          aria-hidden
        />
      ) : null}
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
            <p>
              {data.closed === 'sold'
                ? 'This listing is sold. This chat is closed.'
                : 'This chat is closed. You can no longer send messages here.'}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.composerWrap}>
        {replyTo || editing ? (
          <div className={styles.replyBar}>
            <span className={styles.replyBarText}>
              <span className={styles.quoteWho}>
                {editing
                  ? 'Editing your message'
                  : replyTo!.side === data.side
                    ? 'Replying to your message'
                    : `Replying to ${data.other.name}`}
              </span>
              <span className={styles.quoteText}>{(editing ?? replyTo)!.body}</span>
            </span>
            <button type="button" className={styles.replyBarClose} aria-label="Cancel" onClick={stopComposing}>
              <CloseIcon size={16} />
            </button>
          </div>
        ) : null}
        {/* A new chat: a few ready messages to start with, one tap to send. */}
        {data.messages.length === 0 ? (
          <div className={styles.starters}>
            {startersFor(data.listing.type).map((starter) => (
              <button
                key={starter}
                type="button"
                className={styles.starter}
                disabled={send.isPending}
                onClick={() => send.mutate({ body: starter, pendingId: `pending-${Date.now()}` })}
              >
                {starter}
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.composer}>
          <span className={styles.inputWrap}>
          <textarea
            ref={input}
            onScroll={() => {
              followInput();
              showBar('input');
            }}
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
          {/* Its own thin blue bar, inside the box, as the menus have. */}
          {inputBar ? (
            <span
              className={[styles.inputBar, barShown === 'input' ? styles.barShown : ''].filter(Boolean).join(' ')}
              style={{ top: inputBar.top, height: inputBar.height }}
              aria-hidden
            />
          ) : null}
          </span>
          {/* Send: a paper plane in a green round, as tall as the box. */}
          <Button size="md" iconOnly disabled={!body} onClick={submit} aria-label="Send">
            <SendIcon size={20} />
          </Button>
        </div>
        </div>
      )}

      {menu ? (
        <Sheet
          narrow
          title="Chat options"
          heading={
            <span className={styles.sheetHeading}>
              <span className={styles.sheetIcon} aria-hidden>
                <SettingsIcon size={18} />
              </span>
              Chat options
            </span>
          }
          onClose={() => setMenu(false)}
        >
          {/* Outlined buttons, each with its icon before the words, in the
              button's own blue. The sheet's X closes it. */}
          <div className={styles.options}>
            <Button
              variant="secondary"
              size="md"
              block
              onClick={() => {
                setMenu(false);
                setReporting(true);
              }}
            >
              <ReportIcon size={17} />
              Report this chat
            </Button>
            <Button
              variant="secondary"
              size="md"
              block
              loading={block.isPending}
              onClick={() => block.mutate(!data.blockedByMe)}
            >
              <ShieldIcon size={17} />
              {data.blockedByMe ? `Unblock ${data.other.name}` : `Block ${data.other.name}`}
            </Button>
          </div>
        </Sheet>
      ) : null}
      {reporting ? <ReportSheet chatId={chatId} name={data.other.name} onClose={() => setReporting(false)} /> : null}
    </div>
  );
}

/** How long a finger rests on a message before Reply and Edit show. */
const LONG_PRESS_MS = 450;

/** "Saturday 29 November at 14:00": when a sold listing's chat closes. */
function closingTime(at: string): string {
  const when = new Date(at);
  const day = when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day.replace(',', '')} at ${time}`;
}

/**
 * The elastic edge at the top and the bottom of a chat, as the feed's
 * photos have at their first and last: pull down at the top, or up at the
 * bottom, and the conversation stretches a little after the finger, less
 * the further it is pulled, then eases back when let go. It says "that is
 * all" without a word. The phone's own edge effect is switched off for it,
 * so it is the same on every phone. Touch only.
 */
function useEdgeStretch(
  scroller: React.RefObject<HTMLDivElement | null>,
  content: React.RefObject<HTMLDivElement | null>,
  on: boolean,
) {
  // Taking hold once it is on (the chat on screen), letting go when off.
  useEffect(() => {
    const box = scroller.current;
    const inner = content.current;
    if (!on || !box || !inner) return;
    let startY = 0;
    let startX = 0;
    let atTop = false;
    let atBottom = false;
    /** Undecided until the finger has moved enough to tell down from across. */
    let down: boolean | null = null;
    let pulled = false;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1) return;
      startY = touch.clientY;
      startX = touch.clientX;
      atTop = box.scrollTop <= 1;
      atBottom = box.scrollTop >= box.scrollHeight - box.clientHeight - 1;
      down = null;
      pulled = false;
    };
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const dy = touch.clientY - startY;
      const dx = touch.clientX - startX;
      if (down === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        down = Math.abs(dy) > Math.abs(dx);
      }
      if (!down) return;
      // Only against an end: down from the top, up from the bottom.
      const against = (dy > 0 && atTop) || (dy < 0 && atBottom);
      if (!against) {
        if (pulled) inner.style.transform = '';
        return;
      }
      // The further the pull, the less it gives; slight, as the photos.
      const height = box.clientHeight || 1;
      const give = (1 - 1 / ((Math.abs(dy) * 0.55) / height + 1)) * height;
      pulled = true;
      inner.style.transition = 'none';
      inner.style.transformOrigin = dy > 0 ? 'center top' : 'center bottom';
      inner.style.transform = `scaleY(${1 + give / (4 * height)})`;
    };
    const onEnd = () => {
      if (!pulled) return;
      pulled = false;
      // Let go: it snaps most of the way back, then eases to rest.
      inner.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
      inner.style.transform = '';
    };

    box.addEventListener('touchstart', onStart, { passive: true });
    box.addEventListener('touchmove', onMove, { passive: true });
    box.addEventListener('touchend', onEnd);
    box.addEventListener('touchcancel', onEnd);
    return () => {
      box.removeEventListener('touchstart', onStart);
      box.removeEventListener('touchmove', onMove);
      box.removeEventListener('touchend', onEnd);
      box.removeEventListener('touchcancel', onEnd);
    };
    // The parts are the chat's own, there while it is on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
}

/** Ready messages to start a new chat with, for the kind of listing. */
function startersFor(type: string): string[] {
  if (type === 'swap') return ['Is this still available?', 'Would you swap it for mine?', 'Where can we meet?'];
  if (type === 'request') return ['Are you still looking?', 'I have one. Want photos?', 'Where can we meet?'];
  return ['Is this still available?', "What's your best price?", 'Where can we meet?'];
}

/** The chat's skeleton: the same top, listing strip, bubbles and box. */
export function ChatBones({ backPhoneOnly = false, fill = false }: { backPhoneOnly?: boolean; fill?: boolean }) {
  return (
    <div className={[styles.chat, fill ? styles.chatFill : ''].filter(Boolean).join(' ')} aria-busy>
      <div className={styles.chatTop}>
        <Bone width={36} height={36} shape="circle" className={backPhoneOnly ? styles.phoneOnly : undefined} />
        <Bone width={110} height={18} className={styles.chatNameBone} />
        <Bone width={36} height={36} shape="circle" />
      </div>
      <div className={styles.chatBody}>
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
      </div>
      <div className={styles.composer}>
        {/* The box takes the room the Send button leaves, as the real one. */}
        <span className={styles.inputWrap}>
          <Bone width="100%" height={44} shape="pill" />
        </span>
        <Bone width={44} height={44} shape="circle" />
      </div>
    </div>
  );
}
