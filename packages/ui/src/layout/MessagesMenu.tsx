'use client';

/**
 * MessagesMenu: the Messages drop down in the marketplace header (see
 * HeaderMenu): the newest few chats and See all messages. The chats are
 * loaded by the web app, which hands its list in (MessagesPreviewContext,
 * in its root layout); without it the Messages button goes straight to
 * the Messages page.
 */

import { createContext, useContext, type ComponentType } from 'react';
import { useChatStore } from '@snt/core';
import { MessageIcon } from '../icons';
import { HeaderMenu } from './HeaderMenu';

/** The newest few chats, from the web app; `onNavigate` closes the menu. */
export const MessagesPreviewContext = createContext<ComponentType<{ onNavigate: () => void }> | null>(null);

export function useMessagesPreview() {
  return useContext(MessagesPreviewContext);
}

export function MessagesMenu({
  anchor,
  href,
  onClose,
}: {
  anchor: HTMLElement | null;
  /** The Messages page. */
  href: string;
  onClose: () => void;
}) {
  const Preview = useMessagesPreview();
  const unread = useChatStore((state) => state.unread);
  return (
    <HeaderMenu
      anchor={anchor}
      title="Messages"
      icon={<MessageIcon size={18} />}
      unread={unread}
      href={href}
      allLabel="See all messages"
      onClose={onClose}
    >
      {(close) => (Preview ? <Preview onNavigate={close} /> : null)}
    </HeaderMenu>
  );
}
