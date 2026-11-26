'use client';

/**
 * HeaderMenu: a drop down from an icon in the marketplace header, the bell
 * (NotificationMenu) or Messages (MessagesMenu): a heading with its icon on
 * a pale tile and how many are new, the newest few, and small "See all"
 * words at its foot for the rest.
 *
 * A white card floating under the icon, its right edge level with the
 * icon's, like the account menu's card on a laptop; on a phone it runs the
 * width of the screen under the header, over a pale veil. A tap outside,
 * its cross, Escape, a row or See all closes it.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { CloseIcon } from '../icons';
import styles from './NotificationMenu.module.css';

/** How long it takes to go, so it can fade away first. */
const CLOSE_MS = 200;

export function HeaderMenu({
  anchor,
  title,
  icon,
  unread,
  href,
  allLabel,
  onClose,
  children,
}: {
  /** The header icon it drops from. */
  anchor: HTMLElement | null;
  /** "Notifications", "Messages". */
  title: string;
  icon: ReactNode;
  /** How many are new, said under the title. */
  unread: number;
  /** The full page. */
  href: string;
  /** "See all notifications". */
  allLabel: string;
  onClose: () => void;
  /** The newest few; `close` closes the drop down as a row is opened. */
  children: (close: () => void) => ReactNode;
}) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const opened = useRef(pathname);
  const [closing, setClosing] = useState(false);
  const [place, setPlace] = useState<{ top: number; right: number } | null>(null);

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
        aria-label={title}
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
            {icon}
          </span>
          <span className={styles.titleText}>
            <span className={styles.title}>{title}</span>
            {unread > 0 ? <span className={styles.new}>{unread} new</span> : null}
          </span>
          <button type="button" className={styles.close} aria-label={`Close ${title.toLowerCase()}`} onClick={close}>
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={styles.list}>{children(close)}</div>
        <div className={styles.foot}>
          {/* Small words, not a button, so the notifications come first
              (Hillary, 2026-11-26). */}
          <Link href={href} className={styles.all} onClick={close}>
            {allLabel}
          </Link>
        </div>
      </div>
    </>,
    document.body,
  );
}
