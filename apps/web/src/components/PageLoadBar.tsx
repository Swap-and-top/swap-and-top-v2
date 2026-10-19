'use client';

/**
 * The thin bar across the very top of the screen while a page is on its way,
 * as YouTube's or GitHub's: the moment something that opens another page is
 * tapped, the app shows it has heard, even before the new page's skeleton.
 *
 * It starts on a tap of a link to another page in the app, on Back and
 * Forward, and on `startPageLoad()` (from @snt/ui) for moves made in code (a form that saves,
 * then opens Stock). It shows only if the wait passes a tenth of a second, so
 * quick moves never flicker; it creeps on while waiting, then fills and fades
 * once the new page's real content is on screen, its skeleton gone. Actions
 * that stay on the page show a spinner in their button instead.
 */

import { useEffect, useRef, useState } from 'react';
import { PAGE_LOAD_START as START } from '@snt/ui';
import styles from './PageLoadBar.module.css';

type Phase = 'idle' | 'waiting' | 'running' | 'done';

/** A link to another page of this app, opened in this tab. */
function isPageMove(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const link = (event.target as Element | null)?.closest?.('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download')) return false;
  // A link that stays on the page when tapped (see PostButton for a guest).
  if (link.hasAttribute('data-no-page-load')) return false;
  const to = new URL(link.href, window.location.href);
  if (to.origin !== window.location.origin) return false;
  // Only a place on this same page: no new page to wait for.
  return to.pathname + to.search !== window.location.pathname + window.location.search;
}

export function PageLoadBar() {
  const [phase, setPhase] = useState<Phase>('idle');
  const from = useRef('');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
    const later = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const finish = () => {
      clear();
      setPhase((now) => (now === 'running' ? 'done' : 'idle'));
      later(() => setPhase('idle'), 400);
    };

    // Arrived: the address has changed and no skeleton is left on screen.
    const watch = () => {
      const moved = window.location.href !== from.current;
      const waiting = document.querySelector('[data-skeleton]');
      if (moved && !waiting) finish();
      else later(watch, 100);
    };

    const start = () => {
      clear();
      from.current = window.location.href;
      setPhase('waiting');
      later(() => setPhase((now) => (now === 'waiting' ? 'running' : now)), 100);
      later(watch, 100);
      // Never left showing, whatever happens.
      later(finish, 15000);
    };

    const onClick = (event: MouseEvent) => {
      if (isPageMove(event)) start();
    };
    const onBack = () => {
      // Back and Forward change the address at once: wait for content only.
      clear();
      from.current = '';
      setPhase('waiting');
      later(() => setPhase((now) => (now === 'waiting' ? 'running' : now)), 100);
      later(watch, 100);
      later(finish, 15000);
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onBack);
    window.addEventListener(START, start);
    return () => {
      clear();
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onBack);
      window.removeEventListener(START, start);
    };
  }, []);

  if (phase === 'idle' || phase === 'waiting') return null;

  return (
    <div
      className={[styles.bar, phase === 'done' ? styles.done : '']
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-label="Loading the page"
    />
  );
}
