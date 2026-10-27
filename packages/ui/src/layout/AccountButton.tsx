'use client';

/**
 * AccountButton — the account end of the header, and the way into the app's
 * menu (see AppMenu): your profile and activity, help, and how to reach us.
 *
 * Signed in, it is the account circle, white with your initials in the
 * gradient's green. Signed out, an outlined person in an outlined circle,
 * in white on the gradient, the size of the account circle; the menu then
 * starts with a way to sign in.
 *
 * On a phone, signed in or not, it is three white lines instead, which the
 * open menu turns into its cross (see BurgerLines).
 */

import { useRef, useState } from 'react';
import { useSessionStore, viewerName } from '@snt/core';
import { AppMenu } from './AppMenu';
import { BurgerLines } from './BurgerLines';
import { GuestMark } from './GuestMark';
import styles from './Headers.module.css';

export function AccountButton() {
  const signedIn = useSessionStore((state) => state.signedIn);
  const viewer = useSessionStore((state) => state.viewer);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const name = signedIn && viewer ? viewerName(viewer) : undefined;

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={signedIn ? 'Your account and the menu' : 'Menu'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={[
          signedIn ? styles.account : styles.signIn,
          styles.menuButton,
          open ? styles.menuOpen : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen((now) => !now)}
      >
        {/* From tablet up: the circle, or the outlined person. */}
        <span className={styles.face}>
          {signedIn ? (
            name ? (
              <span aria-hidden>{initialsOf(name)}</span>
            ) : null
          ) : (
            <GuestMark size={36} className={styles.signInMark} />
          )}
        </span>
        {/* On a phone: three lines. */}
        <span className={styles.burger}>
          <BurgerLines />
        </span>
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
