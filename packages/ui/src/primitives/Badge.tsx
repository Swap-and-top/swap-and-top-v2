/**
 * Badge, StatusBadge and CountBadge.
 *
 * `StatusBadge` maps a listing status to the right tone so the mapping lives in
 * one place. Every badge carries a word, never only a colour.
 */

import type { ReactNode } from 'react';
import type { ListingStatus } from '@snt/core';
import styles from './Badge.module.css';

export type BadgeTone =
  | 'neutral'
  | 'outline'
  | 'success'
  | 'accent'
  | 'accentSolid'
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
  live: 'success',
  sold: 'neutral',
  draft: 'neutral',
  expired: 'neutral',
  withdrawn: 'neutral',
  removed: 'neutral',
};

const STATUS_LABEL: Record<ListingStatus, string> = {
  live: 'Live',
  sold: 'Sold',
  draft: 'Draft',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  removed: 'Removed',
};

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
      <Badge tone="accent" size="lg">
        Sponsored
      </Badge>
    );
  }
  return (
    <Badge tone={STATUS_TONE[status]} size="lg">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Small number bubble, e.g. unread leads on a nav item. */
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className={styles.count}>{count}</span>;
}
