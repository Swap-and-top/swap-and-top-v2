/**
 * Typographic pieces that repeat across every screen.
 *
 * Deliberately not a generic `<Text>` with twenty props — each of these is a
 * named role, so a page reads as what it is rather than as a pile of styles.
 */

import type { ReactNode } from 'react';
import styles from './Text.module.css';

/** Uppercase label above a group, e.g. PROCESSOR. */
export function Eyebrow({
  children,
  tight = false,
  accent = false,
  className,
}: {
  children: ReactNode;
  /** Smallest size, used inside cards for HAS / WANTS. */
  tight?: boolean;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        styles.eyebrow,
        tight ? styles.eyebrowTight : '',
        accent ? styles.eyebrowAccent : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export function Price({
  amount,
  size = 'md',
  className,
}: {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass =
    size === 'lg' ? styles.priceLg : size === 'sm' ? styles.priceSm : styles.priceMd;
  return (
    <span className={[styles.price, sizeClass, className ?? ''].filter(Boolean).join(' ')}>
      ${amount}
    </span>
  );
}

/** The swap top-up amount. Brand blue — the swap's "has" side. */
export function CashAmount({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={[styles.cash, className ?? ''].filter(Boolean).join(' ')}>
      +${amount}
    </span>
  );
}

/**
 * The name of an item, coloured by which side of a deal it is on: blue for
 * something someone owns, green for something someone wants. The same rule as
 * the swap card's two tiles, applied to text. Only the name — never specs.
 */
export function ItemName({
  children,
  side,
  bold = false,
  className,
}: {
  children: ReactNode;
  side: 'owned' | 'wanted';
  /** Set where the name is in bold: bold blue text takes a lighter blue. */
  bold?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[
        side === 'owned' ? styles.owned : styles.wanted,
        bold && side === 'owned' ? styles.ownedBold : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

export function Meta({
  children,
  xs = false,
  className,
}: {
  children: ReactNode;
  xs?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[styles.meta, xs ? styles.metaXs : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <h1 className={styles.screenTitle}>{children}</h1>;
}

export function PageHeading({ children }: { children: ReactNode }) {
  return <h1 className={styles.pageHeading}>{children}</h1>;
}

export function Body({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={[styles.body, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </p>
  );
}

/**
 * A note with an icon. Used for safety guidance, privacy disclosure and
 * explanation. Safety copy always sits next to the action it concerns — advice
 * in a help page is decoration, advice at the point of decision is a control.
 */
export function Note({
  icon,
  tone = 'surface',
  children,
  className,
}: {
  icon?: ReactNode;
  tone?: 'surface' | 'subtle' | 'accent';
  children: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === 'accent'
      ? styles.noteAccent
      : tone === 'subtle'
        ? styles.noteSubtle
        : styles.noteSurface;

  return (
    <div className={[styles.note, toneClass, className ?? ''].filter(Boolean).join(' ')}>
      {icon ? <span className={styles.noteIcon}>{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}

/** Centred caption under a primary action. */
export function Caption({ children }: { children: ReactNode }) {
  return <div className={styles.caption}>{children}</div>;
}
