'use client';

/**
 * Sheet — something that opens over the page instead of replacing it: a
 * sheet rising from the bottom of a phone, a panel in the middle of a wider
 * screen. The page it was opened from stays in sight behind it.
 *
 * A native modal <dialog>, portalled to <body> so no card's clipping or
 * transform reaches it; it holds focus while open and returns it on close.
 * Escape, the cross or a tap on the dimmed page behind closes it. The dialog
 * itself is a still, clear layer over the screen; the panel inside it is
 * what rises and sinks, so nothing moves the toasts, which sit in the dialog
 * while it is open (see AppToaster).
 *
 * It goes the way it came: rising in when it opens, sinking away when it
 * closes. Anything inside it that should close it — a sent form, say —
 * calls `useCloseSheet()`, so that close is animated too.
 */

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../icons';
import { placeToasts } from './AppToaster';
import styles from './Sheet.module.css';

const CloseContext = createContext<() => void>(() => {});

/** How far the scroll indicator stays from the panel's top and bottom:
    clear of its round corners. */
const THUMB_INSET = 18;

/**
 * The sheet's own scroll indicator (`.thumb`), in place of the browser's,
 * which Firefox and Zen draw on the panel's edge, into its round corners.
 * Placed over the panel as `scroller` scrolls or changes size, hidden when
 * nothing scrolls, and dragged to scroll. A listener, not loading.
 */
function useScrollThumb(
  scroller: React.RefObject<HTMLDivElement | null>,
  thumb: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const box = scroller.current;
    const bar = thumb.current;
    if (!box || !bar) return;

    const track = () => box.clientHeight - THUMB_INSET * 2;
    const size = () => Math.max(32, (track() * box.clientHeight) / box.scrollHeight);

    function place() {
      if (!box || !bar) return;
      const room = box.scrollHeight - box.clientHeight;
      bar.hidden = room <= 1;
      if (bar.hidden) return;
      const height = size();
      const top = THUMB_INSET + (box.scrollTop / room) * (track() - height);
      bar.style.height = `${height}px`;
      bar.style.transform = `translateY(${top}px)`;
    }

    // Dragged: the page moves as far, in proportion, as the bar does.
    let from: { y: number; scroll: number } | null = null;
    function down(event: PointerEvent) {
      from = { y: event.clientY, scroll: box!.scrollTop };
      bar!.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
    function move(event: PointerEvent) {
      if (!from || !box) return;
      const room = box.scrollHeight - box.clientHeight;
      const free = track() - size();
      if (free > 0) box.scrollTop = from.scroll + ((event.clientY - from.y) * room) / free;
    }
    function up() {
      from = null;
    }

    place();
    box.addEventListener('scroll', place, { passive: true });
    bar.addEventListener('pointerdown', down);
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
    // The sheet's size, or what is in it, changing.
    const watch = new ResizeObserver(place);
    watch.observe(box);
    if (box.firstElementChild) watch.observe(box.firstElementChild);
    return () => {
      box.removeEventListener('scroll', place);
      bar.removeEventListener('pointerdown', down);
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
      watch.disconnect();
    };
  }, [scroller, thumb]);
}


/** Closes the sheet this is inside, animating it away. */
export function useCloseSheet(): () => void {
  return useContext(CloseContext);
}

export function Sheet({
  title,
  heading,
  narrow = false,
  wide = false,
  onClose,
  children,
}: {
  /** The sheet's name, for screen readers — and shown, unless `heading` is. */
  title: string;
  /** Something richer to show at the top in place of the plain title. */
  heading?: ReactNode;
  /** A narrower panel on a wide screen, for a short, simple sheet. */
  narrow?: boolean;
  /** A wider panel on a wide screen, for a form laid out in two columns. */
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  useScrollThumb(scroller, thumb);
  const titleId = useId();
  const [closing, setClosing] = useState(false);
  const done = useRef(false);


  /** Tells the owner, once, that the sheet has gone. */
  function finish() {
    if (done.current) return;
    done.current = true;
    // The toasts out first, so they go on showing after it.
    placeToasts(dialog.current);
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

  // However it goes, the toasts leave it before it is taken away: a layout
  // effect's cleanup runs while the dialog is still in the page.
  useLayoutEffect(() => {
    const el = dialog.current;
    return () => placeToasts(el);
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    // The toasts come into it, so they stay in front and can be tapped.
    placeToasts();
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
      className={[styles.layer, closing ? styles.layerClosing : '']
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: close through React, so the opener hears about it.
        event.preventDefault();
        close();
      }}
      // A tap on the dimmed page around the panel, not on it, closes it.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {/* The panel: what rises in and sinks away. */}
      <div
        className={[
          styles.sheet,
          narrow ? styles.narrow : '',
          wide ? styles.wide : '',
          closing ? styles.closing : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) finish();
        }}
      >
      <CloseContext.Provider value={close}>
      {/* What scrolls, inside the still, rounded panel, with its own
          indicator over it. */}
      <div ref={scroller} className={styles.scroll}>
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
      </div>
      <div ref={thumb} className={styles.thumb} hidden aria-hidden />
      </CloseContext.Provider>
      </div>
    </dialog>,
    document.body,
  );
}
