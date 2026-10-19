/**
 * Badge, StatusBadge and CountBadge.
 *
 * `StatusBadge` maps a listing status to the right tone so the mapping lives in
 * one place. Every badge carries a word, never only a colour.
 */

import type { ReactNode } from 'react';
import type { ListingStatus } from '@snt/core';
import { CheckIcon, MegaphoneIcon, PencilIcon } from '../icons';
import styles from './Badge.module.css';

export type BadgeTone =
  | 'neutral'
  | 'outline'
  | 'success'
  | 'accent'
  | 'accentSolid'
  | 'danger'
  | 'dark';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Larger, for sitting beside a price. */
  size?: 'sm' | 'lg';
  /** Pill shape with normal casing, e.g. a condition label. */
  pill?: boolean;
  /** Absolutely positioned at the top-left of a card image. */
  onImage?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  size = 'sm',
  pill = false,
  onImage = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={[
        styles.badge,
        styles[tone],
        size === 'lg' ? styles.lg : '',
        pill ? styles.pill : '',
        onImage ? styles.onImage : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<ListingStatus, BadgeTone> = {
  // As on a listing's own status tag: live green, paused red, sold blue.
  live: 'success',
  paused: 'danger',
  sold: 'accent',
  draft: 'neutral',
  expired: 'neutral',
  withdrawn: 'neutral',
  removed: 'neutral',
};

const STATUS_LABEL: Record<ListingStatus, string> = {
  live: 'Live',
  paused: 'Paused',
  sold: 'Sold',
  draft: 'Draft',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  removed: 'Removed',
};

/**
 * The small mark before a status, as on a listing's own status tag: a dot
 * for live, a pause for paused, a tick for sold, a pencil for a draft still
 * being written, and a megaphone for a sponsored slot, the megaphone of Promote.
 */
function StatusMark({ status }: { status: ListingStatus | 'sponsored' }) {
  switch (status) {
    case 'live':
      return <span className={styles.dot} aria-hidden />;
    case 'paused':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <rect x="1.5" y="1" width="2.4" height="8" rx="0.8" fill="currentColor" />
          <rect x="6.1" y="1" width="2.4" height="8" rx="0.8" fill="currentColor" />
        </svg>
      );
    case 'sold':
      return <CheckIcon size={12} weight={3} />;
    case 'sponsored':
      return <MegaphoneIcon size={12} weight={2.4} />;
    case 'draft':
      return <PencilIcon size={11} />;
    default:
      return null;
  }
}

/** Console stock rows. Sponsored overrides the status, because it is the point. */
export function StatusBadge({
  status,
  sponsored = false,
}: {
  status: ListingStatus;
  sponsored?: boolean;
}) {
  if (sponsored) {
    return (
      <Badge tone="accent" size="lg" className={styles.marked}>
        <StatusMark status="sponsored" />
        Sponsored
      </Badge>
    );
  }
  return (
    <Badge tone={STATUS_TONE[status]} size="lg" className={styles.marked}>
      <StatusMark status={status} />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Small number bubble, e.g. unread leads on a nav item. */
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className={styles.count}>{count}</span>;
}
