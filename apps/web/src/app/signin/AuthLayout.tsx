'use client';

/**
 * The frame every sign in page shares, to the first app's arrangement: on a
 * phone, one white card with a small 3D picture at its top; from tablet up,
 * the card on the brand gradient beside the large 3D picture under a welcome
 * of two or three lines in white ("Forgot your / Swap & Top / password?").
 *
 * Sign in and the password pages put the picture on the left; sign up and
 * its email check put it on the right (`flipped`), as the first app did.
 * Each page's card is its `children`, inside the form it hands over.
 */

import type { FormEvent, ReactNode } from 'react';
import { Footer, Img } from '@snt/ui';
import styles from './SignInPage.module.css';

export interface AuthPicture {
  /** The large picture, from tablet up. */
  hero: string;
  /** The small one at the top of the card on a phone. */
  icon: string;
  /** A wide icon (the paper plane) rather than a square one. */
  wideIcon?: boolean;
  /** A large picture that fills its frame (the envelope): drawn smaller and
      lower, so it clears the welcome. */
  smallHero?: boolean;
}

export function AuthLayout({
  lines,
  picture,
  flipped = false,
  tall = false,
  onSubmit,
  children,
}: {
  /** The welcome: a medium line, "Swap & Top" large, and a medium line. */
  lines: [string, string, string?];
  picture: AuthPicture;
  flipped?: boolean;
  /** As tall as the sign in card, its contents in the middle. */
  tall?: boolean;
  onSubmit?: (event: FormEvent) => void;
  children: ReactNode;
}) {
  const [before, brand, after] = lines;
  return (
    <div className={styles.page}>
      <div className={styles.mainWrapper}>
        <main className={[styles.content, flipped ? styles.flipped : ''].filter(Boolean).join(' ')}>
          <div className={styles.picture} aria-hidden>
            <div className={styles.welcome}>
              {before ? (
                <span className={`${styles.welcomeLine} ${styles.medium}`}>{before}</span>
              ) : null}
              <span className={`${styles.welcomeLine} ${styles.large}`}>{brand}</span>
              {after ? (
                <span className={`${styles.welcomeLine} ${styles.after}`}>{after}</span>
              ) : null}
            </div>
            <Img
              src={picture.hero}
              alt=""
              pulse={false}
              className={[styles.hero, picture.smallHero ? styles.heroSmall : ''].filter(Boolean).join(' ')}
            />
          </div>

          <form
            className={[styles.form, tall ? styles.tall : ''].filter(Boolean).join(' ')}
            onSubmit={onSubmit}
          >
            {/* On a phone: the small 3D picture over the heading. */}
            <div className={picture.wideIcon ? styles.plane : styles.door}>
              <Img src={picture.icon} alt="" pulse={false} />
            </div>
            {children}
          </form>
        </main>
      </div>
      <Footer />
    </div>
  );
}

