/**
 * AppHeader, ScreenHeader and StepHeader.
 *
 * All three sit on the brand gradient with the swept bottom-right corner.
 *
 * `AppHeader` is the branded one on the top-level screens: logo, the yellow
 * "Post New Item" call to action and the account circle, with room underneath
 * for whatever the screen needs in the header — search, category chips, type
 * tabs, a title. `ScreenHeader` is the back-button one on a detail screen.
 * `StepHeader` adds a progress bar for the posting flow.
 *
 * Children render inside `data-surface="brand"`. Chips, tabs and titles read
 * that attribute and switch to their white-on-gradient styles, so a page just
 * drops its normal controls in and they look right.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeftIcon, CloseIcon } from '../icons';
import { Logo } from './Logo';
import styles from './Headers.module.css';

/** The top-level header: logo, post, account — and the screen's own controls. */
export function AppHeader({
  children,
  postHref = '/post',
  accountHref = '/me',
}: {
  /** Search, chips, tabs or a title, stacked under the logo row. */
  children?: ReactNode;
  postHref?: string;
  accountHref?: string;
}) {
  return (
    <header className={styles.app} data-surface="brand">
      <div className={styles.inner}>
        <div className={styles.appTop}>
          <Link href="/" className={styles.logo} aria-label="Swap & Top — home">
            <Logo height={36} className={styles.logoArt} />
          </Link>
          <Link href={postHref} className={styles.postButton}>
            Post New Item
          </Link>
          <Link
            href={accountHref}
            aria-label="Your account"
            className={styles.account}
          />
        </div>

        {children ? <div className={styles.appBody}>{children}</div> : null}
      </div>
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
  children,
}: {
  backHref: string;
  title?: string;
  /** Renders the title heavier, e.g. "Swap & Top" on a swap detail. */
  accentTitle?: boolean;
  /** Centres the title and balances the back button with a spacer. */
  centreTitle?: boolean;
  actions?: ReactNode;
  /** A close cross rather than a back chevron, for a flow that is dismissed. */
  closeInstead?: boolean;
  /** Anything that belongs under the title row, e.g. a progress bar. */
  children?: ReactNode;
}) {
  return (
    <header className={styles.screen} data-surface="brand">
      <div className={styles.inner}>
        <div className={styles.screenRow}>
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
        </div>
        {children}
      </div>
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
    <ScreenHeader
      backHref={backHref}
      title={`Step ${step} of ${total}`}
      centreTitle
      closeInstead={closeInstead}
    >
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
    </ScreenHeader>
  );
}
