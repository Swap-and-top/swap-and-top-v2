/**
 * AppHeader, ScreenHeader and StepHeader.
 *
 * `AppHeader` is the branded one on the feed. `ScreenHeader` is the back-button
 * one on a detail screen. `StepHeader` adds a progress bar for the posting flow.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BellIcon, ChevronLeftIcon, CloseIcon } from '../icons';
import styles from './Headers.module.css';

/** The feed's header: wordmark plus alerts. */
export function AppHeader({ alertsHref = '/me' }: { alertsHref?: string }) {
  return (
    <header className={styles.app}>
      <Link href="/" className={styles.wordmark}>
        Swap &amp; Top
      </Link>
      <Link href={alertsHref} aria-label="Alerts" className={styles.iconButton}>
        <BellIcon size={21} />
      </Link>
    </header>
  );
}

/** Back, an optional title, and optional trailing actions. */
export function ScreenHeader({
  backHref,
  title,
  accentTitle = false,
  centreTitle = false,
  actions,
  closeInstead = false,
}: {
  backHref: string;
  title?: string;
  /** Renders the title in clay, e.g. "Swap & Top" on a swap detail. */
  accentTitle?: boolean;
  /** Centres the title and balances the back button with a spacer. */
  centreTitle?: boolean;
  actions?: ReactNode;
  /** A close cross rather than a back chevron, for a flow that is dismissed. */
  closeInstead?: boolean;
}) {
  return (
    <header className={styles.screen}>
      <Link
        href={backHref}
        aria-label={closeInstead ? 'Close' : 'Back'}
        className={styles.iconButton}
      >
        {closeInstead ? <CloseIcon size={21} /> : <ChevronLeftIcon size={22} />}
      </Link>

      <span
        className={[
          styles.title,
          accentTitle ? styles.titleAccent : '',
          centreTitle ? styles.titleCentre : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {title}
      </span>

      {actions ?? (centreTitle ? <span className={styles.spacer} /> : null)}
    </header>
  );
}

/** Icon button for a header's trailing actions. */
export function HeaderIconButton({
  label,
  onClick,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} aria-label={label} className={styles.iconButton}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      className={styles.iconButton}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** The posting flow's header: close, "Step N of 3", and a progress bar. */
export function StepHeader({
  step,
  total = 3,
  backHref,
  closeInstead = false,
}: {
  step: number;
  total?: number;
  backHref: string;
  closeInstead?: boolean;
}) {
  const percent = Math.round((step / total) * 100);

  return (
    <>
      <ScreenHeader
        backHref={backHref}
        title={`Step ${step} of ${total}`}
        centreTitle
        closeInstead={closeInstead}
      />
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${step} of ${total}`}
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
    </>
  );
}
