'use client';

/**
 * Keeps a skeleton steady when it is swapped for another. A bone waits half
 * a second before it shows (so a quick page never flashes one); but when one
 * skeleton gives way to the next (the console's frame, then the page's own),
 * the new bones would blink out for that half second. So once bones have been
 * on screen that long, the page is marked (`data-bones-shown` on <html>) and
 * any new bone shows at once (Skeleton.module.css). The mark goes a moment
 * after the last bone does.
 *
 * And every bone then pulses on one clock: a skeleton swapped for its twin
 * (the console's, then the route's, then the page's own) would otherwise
 * start its slow pulse afresh, a shade apart from the one it replaced, which
 * reads as a flash. Each bone's pulse is set to where the clock is now, as
 * it arrives, before it is drawn. A listener, not loading.
 */

/** The pulse, there and back (Skeleton.module.css: 1.2s, alternate). */
const PULSE_MS = 2400;

/** Puts these bones' pulse where the shared clock is. */
function inStep(bones: Iterable<Element>) {
  const at = `${-(performance.now() % PULSE_MS)}ms`;
  for (const bone of bones) {
    if (bone instanceof HTMLElement) bone.style.animationDelay = at;
  }
}

import { useEffect } from 'react';

export function BoneContinuity() {
  useEffect(() => {
    const root = document.documentElement;
    let since: number | null = null;
    let goneTimer: number | undefined;
    let frame = 0;

    const check = () => {
      frame = 0;
      const showing = document.querySelector('[data-skeleton]') !== null;
      if (showing) {
        window.clearTimeout(goneTimer);
        goneTimer = undefined;
        since ??= Date.now();
        if (Date.now() - since >= 500 && !('bonesShown' in root.dataset)) {
          root.dataset.bonesShown = '';
          inStep(document.querySelectorAll('[data-skeleton]'));
        }
        else window.setTimeout(check, 500 - (Date.now() - since));
      } else if (since !== null && goneTimer === undefined) {
        // A moment's grace, for the next skeleton to take its place.
        goneTimer = window.setTimeout(() => {
          since = null;
          goneTimer = undefined;
          delete root.dataset.bonesShown;
        }, 400);
      }
    };

    const watch = new MutationObserver((changes) => {
      // New bones, once the page shows them at once: in step, before they
      // are drawn.
      if ('bonesShown' in root.dataset) {
        for (const change of changes) {
          for (const node of change.addedNodes) {
            if (!(node instanceof Element)) continue;
            if (node.hasAttribute('data-skeleton')) inStep([node]);
            inStep(node.querySelectorAll('[data-skeleton]'));
          }
        }
      }
      if (!frame) frame = window.requestAnimationFrame(check);
    });
    watch.observe(document.body, { childList: true, subtree: true });
    check();
    return () => {
      watch.disconnect();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(goneTimer);
    };
  }, []);

  return null;
}
