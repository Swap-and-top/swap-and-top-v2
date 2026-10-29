'use client';

/**
 * The page buttons under a Staff console table, shared by the Activity log
 * and People: "1 to 10 of 57" with a gear (Page settings: 10, 20, 30 or 40
 * a page, remembered in this browser), then Previous, nine page numbers at
 * a time with chevrons that jump nine once there are more than nine pages,
 * and Next. With one page they all show, disabled. The button tapped spins
 * until its page has come (the table's TanStack Query keeps the page on
 * show meanwhile and says when it is loading). `PagerSkeleton` stands in
 * for it while the table loads.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Bone, Segmented, Sheet, Spinner, Stack } from '@snt/ui';
import { ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from '@snt/ui/icons';
import styles from './Pager.module.css';

/** Page numbers come nine at a time: 1 to 9, 10 to 18, and so on. */
const BLOCK = 9;

const SIZES = ['10', '20', '30', '40'] as const;
export type PageSize = (typeof SIZES)[number];

/** The block of page numbers the page is in. */
function blockOf(page: number, pages: number): number[] {
  const start = Math.floor((page - 1) / BLOCK) * BLOCK + 1;
  return Array.from({ length: Math.min(BLOCK, pages - start + 1) }, (_, n) => start + n);
}

/** How many a page, remembered in this browser under `key`; 10 to start. */
export function usePageSize(key: string): [PageSize, (size: PageSize) => void] {
  const [size, setSize] = useState<PageSize>('10');
  // Read once the page is open, as the server cannot know.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if ((SIZES as readonly string[]).includes(saved ?? '')) setSize(saved as PageSize);
    } catch {
      // No storage: 10 a page.
    }
  }, [key]);
  const choose = (next: PageSize) => {
    setSize(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // No storage: it lasts until the page is left.
    }
  };
  return [size, choose];
}

export function Pager({
  shown,
  total,
  size,
  loading,
  what,
  onPage,
  onSize,
}: {
  /** The page on show. */
  shown: number;
  total: number;
  size: PageSize;
  /** Another page is on its way: the buttons wait. */
  loading: boolean;
  /** What a page holds, for Page settings: "Actions", "People". */
  what: string;
  onPage: (page: number) => void;
  onSize: (size: PageSize) => void;
}) {
  const [setting, setSetting] = useState(false);
  /** The button tapped last, to spin while its page loads. */
  const [tapped, setTapped] = useState<string | null>(null);
  const go = (key: string, page: number) => {
    setTapped(key);
    onPage(page);
  };
  const busy = (key: string) => loading && tapped === key;
  const perPage = Number(size);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const first = (shown - 1) * perPage + 1;
  const last = Math.min(total, shown * perPage);
  const numbers = blockOf(shown, pages);

  return (
    <div className={styles.pager}>
      <div className={styles.pagerInfo}>
        <span>
          {first} to {last} of {total}
        </span>
        {/* How the page is shown: how many a page. */}
        <button type="button" className={styles.gear} aria-label="Page settings" onClick={() => setSetting(true)}>
          <SettingsIcon size={18} />
        </button>
      </div>
      <div className={styles.pages}>
        <PageButton
          end
          label="Previous page"
          busy={busy('prev')}
          disabled={shown === 1 || loading}
          onClick={() => go('prev', shown - 1)}
        >
          Prev
        </PageButton>
        {pages > BLOCK ? (
          <PageButton
            label="The nine pages before"
            busy={busy('back')}
            disabled={numbers[0]! === 1 || loading}
            onClick={() => go('back', numbers[0]! - BLOCK)}
          >
            <ChevronLeftIcon size={12} />
          </PageButton>
        ) : null}
        {numbers.map((n) => (
          <PageButton
            key={n}
            current={n === shown}
            far={Math.abs(n - shown) > 2}
            busy={busy(String(n))}
            disabled={pages === 1 || loading}
            onClick={() => go(String(n), n)}
          >
            {n}
          </PageButton>
        ))}
        {pages > BLOCK ? (
          <PageButton
            label="The next nine pages"
            busy={busy('on')}
            disabled={numbers.at(-1)! === pages || loading}
            onClick={() => go('on', numbers[0]! + BLOCK)}
          >
            <ChevronRightIcon size={12} />
          </PageButton>
        ) : null}
        <PageButton
          end
          busy={busy('next')}
          disabled={shown === pages || loading}
          onClick={() => go('next', shown + 1)}
        >
          Next
        </PageButton>
      </div>

      {setting ? (
        <Sheet title="Page settings" narrow onClose={() => setSetting(false)}>
          <Stack gap={4}>
            <span className={styles.label}>{what} on one page</span>
            <Segmented<PageSize>
              label={`${what} on one page`}
              options={SIZES.map((value) => ({ value, label: value }))}
              value={size}
              onChange={onSize}
            />
          </Stack>
        </Sheet>
      ) : null}
    </div>
  );
}

/** While the table loads: the count, the gear and the page buttons. */
export function PagerSkeleton() {
  return (
    <div className={styles.pager} aria-hidden>
      <div className={styles.pagerInfo}>
        <Bone width={80} height={12} />
        <Bone width={18} height={18} shape="circle" />
      </div>
      <div className={styles.pages}>
        <Bone width={62} height={26} shape="pill" className={styles.pageEnd} />
        {Array.from({ length: 3 }, (_, n) => (
          <Bone key={n} width={26} height={26} shape="circle" />
        ))}
        <Bone width={46} height={26} shape="pill" className={styles.pageEnd} />
      </div>
    </div>
  );
}

/** A page button: small, the height of the "1 to 10 of 57" beside it,
    outlined in the blue; the page on show filled in the blue. */
function PageButton({
  current = false,
  end = false,
  far = false,
  busy = false,
  disabled,
  label,
  onClick,
  children,
}: {
  current?: boolean;
  /** Previous or Next. */
  end?: boolean;
  /** More than two pages from the one on show: left out on a phone. */
  far?: boolean;
  /** Tapped, and its page is on its way: a small spinner in its place. */
  busy?: boolean;
  disabled: boolean;
  label?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={[styles.pageButton, current ? styles.pageCurrent : '', end ? styles.pageEnd : '', far ? styles.far : '']
        .filter(Boolean)
        .join(' ')}
      aria-current={current ? 'page' : undefined}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {/* The label keeps its room under the spinner, so nothing moves. */}
      <span className={busy ? styles.hidden : undefined}>{children}</span>
      {busy ? <Spinner size={12} label="" className={styles.spinner} /> : null}
    </button>
  );
}
