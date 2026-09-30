/**
 * Screen and its parts.
 *
 * Every marketplace page is built from these: a Screen wrapper, a header, a
 * ScreenBody, and optionally a sticky ScreenFooter and a BottomNav.
 */

import type { ReactNode } from 'react';
import styles from './Screen.module.css';

export function Screen({
  children,
  surface = false,
}: {
  children: ReactNode;
  /** White background, for a screen that is one continuous surface. */
  surface?: boolean;
}) {
  return (
    <div
      className={[styles.screen, surface ? styles.screenSurface : '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export function ScreenBody({
  children,
  flush = false,
  top = true,
}: {
  children: ReactNode;
  /** Removes the horizontal gutter, for content that bleeds to the edge. */
  flush?: boolean;
  /** Adds top padding. Turn it off when a band sits directly above. */
  top?: boolean;
}) {
  return (
    <div
      className={[
        styles.body,
        flush ? styles.bodyFlush : '',
        top ? styles.bodyTop : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.column}>{children}</div>
    </div>
  );
}

/** Sticky action bar. Primary action first, then an icon-only secondary. */
export function ScreenFooter({
  children,
  caption,
}: {
  children: ReactNode;
  /** Safety or disclosure line, shown directly under the action. */
  caption?: ReactNode;
}) {
  return (
    <div className={styles.footer}>
      <div className={styles.column}>
        <div className={styles.footerActions}>{children}</div>
        {caption ? <div className={styles.footerCaption}>{caption}</div> : null}
      </div>
    </div>
  );
}

/** A white band under a header, holding a title or filters. */
export function Band({
  children,
  tight = false,
}: {
  children: ReactNode;
  /** No bottom padding, for a band that sits directly above tabs. */
  tight?: boolean;
}) {
  return (
    <div className={[styles.band, tight ? styles.bandTight : ''].filter(Boolean).join(' ')}>
      <div className={styles.column}>{children}</div>
    </div>
  );
}

/**
 * Empty state. Never leave a blank screen: say what happened and offer the way
 * out — the nearest match with one filter relaxed, or posting a request.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyTitle}>{title}</div>
      <p className={styles.emptyBody}>{body}</p>
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
}
