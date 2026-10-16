'use client';

/**
 * InputModality — notes whether the visitor is using the keyboard or a
 * pointer (a finger, a mouse), as `data-input` on <html>.
 *
 * A text box being typed in shows a focus ring only for someone moving
 * through the page with Tab — they need to see where they are. Someone who
 * tapped or clicked into it already knows, and on a phone the ring is just
 * clutter. Browsers treat every focused text box as "focus-visible", so they
 * cannot tell the two apart; this does, and the styles read it.
 *
 * Mounted once, in the root layout.
 */

import { useEffect } from 'react';

export function InputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Tab') root.dataset.input = 'keyboard';
    };
    const pointer = () => {
      root.dataset.input = 'pointer';
    };
    root.dataset.input = 'pointer';
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('pointerdown', pointer, true);
    return () => {
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('pointerdown', pointer, true);
    };
  }, []);

  return null;
}
