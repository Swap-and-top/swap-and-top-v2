'use client';

/**
 * NotificationMenu: the bell's drop down in the marketplace header. The
 * newest five notifications, in the same rows as the Notifications page,
 * and See all notifications at its foot for the rest.
 *
 * A white card floating under the bell, its right edge level with the
 * bell's, like the account menu's card on a laptop; on a phone it runs the
 * width of the screen under the header, over a pale veil. A tap outside,
 * its cross, Escape, a row or See all closes it.
 */

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUnreadCount } from '@snt/core';
import { BellIcon, CloseIcon } from '../icons';
import { ButtonLink } from '../primitives/Button';
import { NotificationList } from './NotificationList';
import styles from './NotificationMenu.module.css';

/** How many it shows before See all notifications. */
const SHOWN = 5;
/** How long it takes to go, so it can fade away first. */
const CLOSE_MS = 200;

export function NotificationMenu({
  anchor,
  href,
  onClose,
}: {
  /** The bell it drops from. */
  anchor: HTMLElement | null;
  /** The Notifications page. */
  href: string;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const opened = useRef(pathname);
  const [closing, setClosing] = useState(false);
  const [place, setPlace] = useState<{ top: number; right: number } | null>(null);
  const unread = useUnreadCount('user');

  function close() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, CLOSE_MS);
  }

  // Under the bell, measured before it is first drawn so it never jumps,
  // and again as the window changes size: a listener, not loading.
  useLayoutEffect(() => {
    if (!anchor) return;
    const measure = () => {
      const at = anchor.getBoundingClientRect();
      setPlace({
        top: at.bottom + 10,
        right: Math.max(12, document.documentElement.clientWidth - at.right),
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [anchor]);

  // Closes on a move to another page.
  useEffect(() => {
    if (pathname !== opened.current) onClose();
  }, [pathname, onClose]);

  // Closes on Escape or a tap outside (a tap on the bell is the bell's own).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || anchor?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    // On a phone the page behind stays still while it is open.
    const phone = window.matchMedia('(max-width: 767px)').matches;
    const before = document.body.style.overflow;
    if (phone) document.body.style.overflow = 'hidden';
    panel.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
      document.body.style.overflow = before;
    };
    // `close` reads the latest state itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  return createPortal(
    <>
      <div
        className={[styles.backdrop, closing ? styles.closing : ''].filter(Boolean).join(' ')}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-label="Notifications"
        tabIndex={-1}
        className={[styles.panel, closing ? styles.closing : ''].filter(Boolean).join(' ')}
        style={
          place
            ? ({
                '--menu-top': `${place.top}px`,
                '--menu-right': `${place.right}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className={styles.head}>
          <span className={styles.titleIcon} aria-hidden>
            <BellIcon size={18} />
          </span>
          <span className={styles.titleText}>
            <span className={styles.title}>Notifications</span>
            {unread > 0 ? <span className={styles.new}>{unread} new</span> : null}
          </span>
          <button type="button" className={styles.close} aria-label="Close notifications" onClick={close}>
            <CloseIcon size={18} />
          </button>
        </div>
        <NotificationList
          audience="user"
          limit={SHOWN}
          onNavigate={close}
          icons={false}
          className={styles.list}
        />
        <div className={styles.foot}>
          <ButtonLink href={href} variant="secondary" size="sm" block onClick={close}>
            See all notifications
          </ButtonLink>
        </div>
      </div>
    </>,
    document.body,
  );
}
