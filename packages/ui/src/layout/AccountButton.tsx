'use client';

/**
 * AccountButton — the account end of the header, and the way into the app's
 * menu (see AppMenu): your profile and activity, help, and how to reach us.
 *
 * Signed in, it is the account circle, white with your initials in the
 * gradient's green. Signed out, an outlined person in an outlined circle,
 * in white on the gradient, the size of the account circle; the menu then
 * starts with a way to sign in.
 */

import { useRef, useState } from 'react';
import { getUser, useSessionStore, useViewerId } from '@snt/core';
import { AppMenu } from './AppMenu';
import styles from './Headers.module.css';

export function AccountButton() {
  const signedIn = useSessionStore((state) => state.signedIn);
  const viewerId = useViewerId();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const name = signedIn && viewerId ? getUser(viewerId)?.displayName : undefined;

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={signedIn ? 'Your account and the menu' : 'Menu'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={signedIn ? styles.account : styles.signIn}
        onClick={() => setOpen((now) => !now)}
      >
        {signedIn ? (
          name ? (
            <span aria-hidden>{initialsOf(name)}</span>
          ) : null
        ) : (
          <svg
            className={`snt-icon ${styles.signInMark}`}
            viewBox="0 0 24 24"
            width="36"
            height="36"
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
        )}
      </button>
      {open ? (
        <AppMenu anchor={button.current} onClose={() => setOpen(false)} />
      ) : null}
    </>
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
