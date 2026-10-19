'use client';

/**
 * Button and ButtonLink.
 *
 * Two components sharing one set of styles, because the wireframes use anchors
 * styled as buttons wherever the action navigates. Use `ButtonLink` when it goes
 * somewhere and `Button` when it does something — a real `<a>` or `<button>`
 * every time, never a div with a click handler.
 */

import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'subtle'
  | 'dark'
  | 'blue'
  | 'success'
  | 'dashed';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container's full width. */
  block?: boolean;
  /** Square, for a single icon. Requires `aria-label`. */
  iconOnly?: boolean;
  children?: ReactNode;
}

function classesFor({
  variant = 'primary',
  size = 'md',
  block,
  iconOnly,
  className,
}: SharedProps & { className?: string }): string {
  return [
    styles.base,
    styles[variant],
    styles[size],
    block ? styles.block : '',
    iconOnly ? styles.iconOnly : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    /**
     * Working on it: the spinner turns where the words were, the button
     * keeps its size so nothing moves, and it cannot be pressed again.
     */
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  block,
  iconOnly,
  className,
  type = 'button',
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        classesFor({ variant, size, block, iconOnly, className }),
        loading ? styles.loading : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          {/* The words stay, unseen, to hold the button's width. */}
          <span className={styles.held}>{children}</span>
          <span className={styles.spinning}>
            <Spinner size={size === 'sm' ? 16 : 20} label="" />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export type ButtonLinkProps = SharedProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'href' | 'children'
  >;

export function ButtonLink({
  variant,
  size,
  block,
  iconOnly,
  className,
  href,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={classesFor({ variant, size, block, iconOnly, className })}
      {...rest}
    >
      {children}
    </Link>
  );
}
