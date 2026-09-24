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
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'subtle'
  | 'dark'
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
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function Button({
  variant,
  size,
  block,
  iconOnly,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classesFor({ variant, size, block, iconOnly, className })}
      {...rest}
    >
      {children}
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
