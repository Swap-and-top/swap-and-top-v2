'use client';

/**
 * AutoHideHeader — the app header's bar, which on a phone moves with the page.
 *
 * It is pinned to the top of the screen. Going away, it is attached to the
 * page: scroll down and it goes up with the content, pixel for pixel, until
 * it is off the screen. Coming back, it is offered: the moment the page is
 * scrolled back up — anywhere on it — the whole bar slides in with a short,
 * eased animation of its own, rather than waiting to be dragged down.
 * Phones only; from tablet up it is left alone.
 */

import { useEffect, useRef, type ReactNode } from 'react';

const PHONE = '(max-width: 767px)';

/**
 * The slide back in: unhurried, starting gently, gathering pace, then
 * settling softly into place.
 */
const REVEAL = 'transform 360ms cubic-bezier(0.45, 0, 0.15, 1)';

export function AutoHideHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = header.current;
    if (!el) return;

    const phone = window.matchMedia(PHONE);
    let last = window.scrollY;
    /** How far the bar is pushed up off the screen, 0 to its own height. */
    let offset = 0;

    const place = (animated: boolean) => {
      el.style.transition = animated ? REVEAL : 'none';
      el.style.transform = offset > 0 ? `translateY(${-offset}px)` : '';
    };

    const onScroll = () => {
      // Clamped, so a rubber-band overscroll past either end does not count.
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.max(0, Math.min(window.scrollY, limit));
      const moved = y - last;
      last = y;
      if (!phone.matches || moved === 0) return;
      if (moved > 0) {
        // Down the page: it leaves with the content, tied to the scroll.
        offset = Math.min(el.offsetHeight, offset + moved);
        place(false);
      } else if (offset > 0) {
        // Back up the page: it slides in whole.
        offset = 0;
        place(true);
      }
    };

    // Turned to landscape or resized past a phone: back in its place.
    const onChange = () => {
      offset = 0;
      last = window.scrollY;
      place(false);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    phone.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('scroll', onScroll);
      phone.removeEventListener('change', onChange);
    };
  }, []);

  return (
    <header ref={header} className={className} data-surface="brand">
      {children}
    </header>
  );
}
