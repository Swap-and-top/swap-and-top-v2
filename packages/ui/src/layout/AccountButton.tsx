'use client';

/**
 * AccountButton — the account end of the header.
 *
 * Signed in, it is the account circle — white, with their initials in the
 * gradient's green — and opens Me. Signed out, it says so
 * plainly: an outlined person in an outlined circle, "Sign in" under it, all
 * in white on the gradient — and it goes to the sign-in page, which brings
 * them back here once they are in.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, useSessionStore, useViewerId } from '@snt/core';
import styles from './Headers.module.css';

export function AccountButton({ href }: { href: string }) {
  const pathname = usePathname();
  const signedIn = useSessionStore((state) => state.signedIn);
  const viewerId = useViewerId();

  if (signedIn) {
    const name = viewerId ? getUser(viewerId)?.displayName : undefined;
    return (
      <Link href={href} aria-label="Your account" className={styles.account}>
        {name ? <span aria-hidden>{initialsOf(name)}</span> : null}
      </Link>
    );
  }

  // Back here once they are in.
  const next = pathname && pathname !== '/signin' ? pathname : '/';

  return (
    <Link href={`/signin?next=${encodeURIComponent(next)}`} className={styles.signIn}>
      <svg
        className={styles.signInMark}
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10.5" />
        <circle cx="12" cy="9.5" r="3.2" />
        <path d="M6.2 18.6c1.1-2.3 3.3-3.6 5.8-3.6s4.7 1.3 5.8 3.6" />
      </svg>
      <span>Sign in</span>
    </Link>
  );
}

/** "Hillary Malinga" → "HM"; "Tarisai M." → "TM". At most two letters. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
