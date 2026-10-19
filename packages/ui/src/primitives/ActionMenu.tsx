'use client';

/**
 * ActionMenu — a round three dot button that opens a short list of actions,
 * for a row with more to do than fits beside it (a stock item: edit, pause,
 * mark sold, delete).
 *
 * The list opens under the button, or above it near the foot of the screen,
 * over everything, so no rounded card it sits in can cut it off. It closes
 * on a choice, a tap anywhere else, Escape, or a scroll. Arrow keys move
 * through it.
 */

import Link from 'next/link';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { MoreIcon } from '../icons';
import styles from './ActionMenu.module.css';

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  /** Goes somewhere; otherwise `onSelect` runs. */
  href?: string;
  onSelect?: () => void;
  /** Red, for deleting. */
  danger?: boolean;
}

export function ActionMenu({
  label,
  actions,
  className,
}: {
  /** What the button is for, said to screen readers, e.g. "More for T480". */
  label: string;
  actions: MenuAction[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Under the button, right edges level; above it if there is no room below.
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const at = button.current.getBoundingClientRect();
    const height = list.current?.offsetHeight ?? 0;
    const below = at.bottom + 6;
    const top =
      below + height > window.innerHeight - 8 ? at.top - 6 - height : below;
    setPlace({ top: Math.max(8, top), right: window.innerWidth - at.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (list.current?.contains(target) || button.current?.contains(target)) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      const items = [
        ...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
      ];
      const at = items.indexOf(document.activeElement as HTMLElement);
      if (event.key === 'Escape') {
        close();
        button.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        items[(at + 1) % items.length]?.focus({ preventScroll: true });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        items[(at - 1 + items.length) % items.length]?.focus({
          preventScroll: true,
        });
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    // The first action takes the focus, for the keyboard, without moving
    // the page (which would read as a scroll, and close it).
    list.current
      ?.querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((now) => !now)}
      >
        <MoreIcon size={18} />
      </button>

      {open
        ? createPortal(
            <div
              ref={list}
              role="menu"
              aria-label={label}
              className={styles.list}
              style={
                place
                  ? { top: place.top, right: place.right }
                  : { visibility: 'hidden', top: 0, right: 0 }
              }
            >
              {actions.map((action) => {
                const inner = (
                  <>
                    {action.icon ? (
                      <span className={styles.icon}>{action.icon}</span>
                    ) : null}
                    {action.label}
                  </>
                );
                const className = [styles.item, action.danger ? styles.danger : '']
                  .filter(Boolean)
                  .join(' ');
                return action.href ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    role="menuitem"
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    role="menuitem"
                    className={className}
                    onClick={() => {
                      setOpen(false);
                      action.onSelect?.();
                    }}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
