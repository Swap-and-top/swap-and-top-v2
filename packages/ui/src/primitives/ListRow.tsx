/**
 * ListRow, ListGroup and ConsoleEntryRow.
 *
 * A row is always a link. If you need one that only performs an action, add a
 * `<button>` variant rather than putting a handler on the anchor.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRightIcon } from '../icons';
import styles from './ListRow.module.css';

/** Rounded container that clips its rows and draws the rules between them. */
export function ListGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={[styles.group, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function ListRow({
  href,
  icon,
  label,
  value,
  valueStrong = false,
  badge,
  chevron = true,
}: {
  href: string;
  icon?: ReactNode;
  label: string;
  /** Right-aligned secondary text, e.g. a count. */
  value?: string;
  /** Renders the value in ink rather than grey, for something meaningful. */
  valueStrong?: boolean;
  /** A count bubble, e.g. deals awaiting confirmation. */
  badge?: ReactNode;
  chevron?: boolean;
}) {
  return (
    <Link href={href} className={styles.row}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.label}>{label}</span>
      {value ? (
        <span
          className={[styles.value, valueStrong ? styles.valueStrong : '']
            .filter(Boolean)
            .join(' ')}
        >
          {value}
        </span>
      ) : null}
      {badge}
      {chevron ? (
        <span className={styles.chevron}>
          <ChevronRightIcon size={17} />
        </span>
      ) : null}
    </Link>
  );
}

/** The dark row that takes a dealer into the console. */
export function ConsoleEntryRow({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className={styles.dark}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>
        <span className={styles.darkTitle}>{title}</span>
        <span className={styles.darkSubtitle}>{subtitle}</span>
      </span>
      <span className={styles.chevron}>
        <ChevronRightIcon size={17} />
      </span>
    </Link>
  );
}
