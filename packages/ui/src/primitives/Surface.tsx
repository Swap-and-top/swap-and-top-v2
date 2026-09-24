/**
 * Panel, Stack, Divider and Section.
 *
 * `Panel` is the white rounded box nearly everything sits in. `Stack` is a
 * vertical flex column with a token gap — used constantly, so it earns being a
 * component rather than a class repeated in forty modules.
 */

import type { ReactNode } from 'react';
import styles from './Surface.module.css';

export type StackGap = 2 | 4 | 5 | 6 | 8 | 10;

export function Panel({
  children,
  padded = false,
  paddedLg = false,
  clip = false,
  xl = false,
  tinted = false,
  accent = false,
  dark = false,
  className,
}: {
  children: ReactNode;
  padded?: boolean;
  /** Slightly roomier padding, for a card with a heading inside it. */
  paddedLg?: boolean;
  /** Clips a full-bleed image at the top. */
  clip?: boolean;
  /** Larger corner radius, for feed cards. */
  xl?: boolean;
  /** The tinted swap panel. */
  tinted?: boolean;
  /** Accent outline — a new lead, or the emphasised option in a list. */
  accent?: boolean;
  /** Dark surface, e.g. the console entry row. */
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        styles.panel,
        xl ? styles.panelXl : '',
        clip ? styles.clip : '',
        padded ? styles.padded : '',
        paddedLg ? styles.paddedLg : '',
        tinted ? styles.tinted : '',
        accent ? styles.accent : '',
        dark ? styles.dark : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export function Stack({
  children,
  gap = 6,
  className,
}: {
  children: ReactNode;
  gap?: StackGap;
  className?: string;
}) {
  const gapClass = (
    {
      2: styles.gap2,
      4: styles.gap4,
      5: styles.gap5,
      6: styles.gap6,
      8: styles.gap8,
      10: styles.gap10,
    } as const
  )[gap];

  return (
    <div className={[styles.stack, gapClass, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function Divider() {
  return <hr className={styles.divider} />;
}

/** A block separated from what is above it by a rule. */
export function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={[styles.section, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
