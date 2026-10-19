'use client';

/**
 * Every new page opens at its top.
 *
 * Moving to a page shows its skeleton first, which can be shorter than how
 * far the last page was scrolled; the browser then holds the scroll at the
 * skeleton's foot, and the page arrives already scrolled down, a long
 * listing at its bottom. So on each move forward the page is put back at the
 * top. Going back is left alone, so the feed returns to where it was; so is a
 * link to a place on a page (an address with #).
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
  const pathname = usePathname();
  const back = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onBack = () => {
      back.current = true;
    };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);

  useLayoutEffect(() => {
    // The first page as loaded: the browser places it.
    if (first.current) {
      first.current = false;
      return;
    }
    if (back.current) {
      back.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
