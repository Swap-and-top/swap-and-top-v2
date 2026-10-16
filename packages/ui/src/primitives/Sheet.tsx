'use client';

/**
 * Sheet — something that opens over the page instead of replacing it: a
 * sheet rising from the bottom of a phone, a panel in the middle of a wider
 * screen. The page it was opened from stays in sight behind it.
 *
 * A native modal <dialog>, portalled to <body> so no card's clipping or
 * transform reaches it; it holds focus while open and returns it on close.
 * Escape, the cross or a tap on the dimmed page behind closes it.
 *
 * It goes the way it came: rising in when it opens, sinking away when it
 * closes. Anything inside it that should close it — a sent form, say —
 * calls `useCloseSheet()`, so that close is animated too.
 */

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../icons';
import styles from './Sheet.module.css';

const CloseContext = createContext<() => void>(() => {});


/** Closes the sheet this is inside, animating it away. */
export function useCloseSheet(): () => void {
  return useContext(CloseContext);
}

export function Sheet({
  title,
  heading,
  narrow = false,
  onClose,
  children,
}: {
  /** The sheet's name, for screen readers — and shown, unless `heading` is. */
  title: string;
  /** Something richer to show at the top in place of the plain title. */
  heading?: ReactNode;
  /** A narrower panel on a wide screen, for a short, simple sheet. */
  narrow?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [closing, setClosing] = useState(false);
  const done = useRef(false);


  /** Tells the owner, once, that the sheet has gone. */
  function finish() {
    if (done.current) return;
    done.current = true;
    onClose();
  }

  /**
   * Sinks the sheet away; the owner is told once it has gone. If the end of
   * the animation is never reported — a tab in the background draws no
   * frames — it is told anyway, just after the animation would have ended.
   */
  function close() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(finish, 500);
  }

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    // The page behind stays put while the sheet is open.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      className={[
        styles.sheet,
        narrow ? styles.narrow : '',
        closing ? styles.closing : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: close through React, so the opener hears about it.
        event.preventDefault();
        close();
      }}
      // A tap on the dimmed page behind, not on the sheet, closes it.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) finish();
      }}
    >
      <CloseContext.Provider value={close}>
      <div className={styles.body}>
        <div className={styles.head}>
          {heading ? (
            <div className={styles.heading}>
              <h2 id={titleId} className="snt-visually-hidden">
                {title}
              </h2>
              {heading}
            </div>
          ) : (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={close}
          >
            <CloseIcon size={18} weight={2.2} />
          </button>
        </div>
        {children}
      </div>
      </CloseContext.Provider>
    </dialog>,
    document.body,
  );
}
