'use client';

/**
 * Footer — the site's foot, as the first app had it: on the brand gradient,
 * the logo, quick links, how to reach the company, its social links; and
 * under it, on the page, the copyright line.
 *
 * Only on pages that stand apart from the feed for now — the sign-in page.
 * Of the quick links only the homepage exists yet; the others say so.
 */

import Link from 'next/link';
import { toast } from 'sonner';
import { CompactLogo, Logo } from './Logo';
import styles from './Footer.module.css';

const SOON = ['Terms of use', 'Privacy policy', 'Tips & recommendations'];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.content}>
          <Link href="/" className={styles.logo} aria-label="Swap & Top home">
            <CompactLogo height={49} className={styles.logoCompact} />
            <Logo height={36} className={styles.logoFull} />
          </Link>

          <nav className={styles.links} aria-label="Quick links">
            <h3 className={styles.title}>Quick Links</h3>
            <Link href="/" className={styles.link}>
              Homepage
            </Link>
            {SOON.map((label) => (
              <button
                key={label}
                type="button"
                className={styles.link}
                onClick={() => toast(`${label} is not up yet.`)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className={styles.contact}>
            <h3 className={styles.title}>Contact Us</h3>
            <p className={styles.detail}>
              <span className={styles.detailLabel}>Phone:</span> +263774689010
            </p>
            <p className={styles.detail}>
              <span className={styles.detailLabel}>Email:</span>{' '}
              mail@swapandtop.co.zw
            </p>
            <p className={styles.detail}>
              <span className={styles.detailLabel}>Address:</span> 4442 Ceres
              Ave, Waterfalls, Harare
            </p>
            <div className={styles.socials}>
              {SOCIALS.map(({ name, href, viewBox, paths }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className={styles.social}
                >
                  <svg viewBox={viewBox} fill="#fff" aria-hidden>
                    {paths.map((d) => (
                      <path key={d.slice(0, 12)} d={d} />
                    ))}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.info}>
        <span>© {year}</span>
        <span className={styles.company}>Greta Works Inc.</span>
        <span>| All rights reserved</span>
      </div>
    </footer>
  );
}

/** The first app's social marks, white discs with the brand cut out. */
const SOCIALS = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com',
    viewBox: '0 0 58.59 58.23',
    paths: [
      'M58.59,29.29C58.59,13.12,45.47,0,29.29,0S0,13.12,0,29.29c0,14.62,10.71,26.74,24.72,28.94v-20.47h-7.44v-8.47h7.44v-6.45c0-7.34,4.37-11.4,11.06-11.4,3.2,0,6.56,.57,6.56,.57v7.21h-3.7c-3.64,0-4.77,2.26-4.77,4.58v5.5h8.12l-1.3,8.47h-6.83v20.47c14.01-2.2,24.72-14.31,24.72-28.94Z',
    ],
  },
  {
    name: 'X',
    href: 'https://www.twitter.com',
    viewBox: '0 0 58.23 58.23',
    paths: [
      'M29.11,0C13.03,0,0,13.03,0,29.11s13.03,29.11,29.11,29.11,29.11-13.03,29.11-29.11S45.19,0,29.11,0Zm7.14,46.48l-9.12-12.1-10.69,12.11h-5.8l13.82-15.65L10.06,11.73h11.91l8.45,11.21,9.86-11.21h5.79l-12.98,14.76,15.06,19.99h-11.91Z',
    ],
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com',
    viewBox: '0 0 58.23 58.23',
    paths: [
      'M29.12,0C13.04,0,0,13.04,0,29.12s13.04,29.12,29.12,29.12,29.12-13.04,29.12-29.12S45.2,0,29.12,0Zm17.55,36.18c-.56,4.18-2.65,4.81-6.76,5.16-3.56,.35-7.6,.42-10.74,.42s-7.25-.07-10.74-.42c-4.11-.35-6.28-.98-6.83-5.16-.21-1.81-.35-4.46-.35-7.11s.14-5.23,.35-7.11c.56-4.11,2.72-4.81,6.83-5.16,3.49-.28,7.6-.42,10.74-.42s7.18,.14,10.74,.42c4.11,.35,6.21,1.05,6.76,5.16,.28,1.88,.42,4.46,.42,7.11s-.14,5.3-.42,7.11Z',
    ],
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com',
    viewBox: '0 0 57.19 57.19',
    paths: [
      'M28.64,22.06h-.09c-3.57,0-6.54,2.96-6.54,6.54s2.96,6.62,6.54,6.62h.09c3.57,0,6.54-2.96,6.54-6.62s-2.96-6.54-6.54-6.54Z',
      'M36.92,13.52H20.27c-3.75,0-6.8,3.05-6.8,6.8v16.56c0,3.75,3.05,6.8,6.8,6.8h16.65c3.75,0,6.8-3.05,6.8-6.8V20.32c0-3.75-3.05-6.8-6.8-6.8Zm-8.28,25.01h-.09c-5.4,0-9.85-4.45-9.85-9.94s4.45-9.940,9.85-9.94h.09c5.4,0,9.94,4.53,9.94,9.94s-4.53,9.94-9.94,9.94Zm9.76-17.61c-1.22,0-2.090-.96-2.090-2.090s.87-2.090,2.090-2.090c1.13,0,2.090,.96,2.090,2.090s-.96,2.090-2.090,2.090Z',
      'M28.6,0C12.8,0,0,12.8,0,28.6s12.8,28.6,28.6,28.6,28.6-12.8,28.6-28.6S44.39,0,28.6,0Zm18.26,36.96c0,5.4-4.45,9.85-9.85,9.85H20.19c-5.4,0-9.85-4.45-9.85-9.85V20.23c0-5.4,4.45-9.85,9.85-9.85h16.82c5.4,0,9.85,4.45,9.85,9.85v16.73Z',
    ],
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com',
    viewBox: '0 0 57.54 57.54',
    paths: [
      'M28.77,0C12.88,0,0,12.880,0,28.77s12.88,28.77,28.77,28.77,28.77-12.88,28.77-28.77S44.66,0,28.77,0Zm-9.52,44.76h-6.48V23h6.48v21.76Zm-3.28-24.96c-2.16,0-3.84-1.76-3.84-3.92s1.68-3.92,3.84-3.92,3.92,1.76,3.92,3.92-1.76,3.92-3.92,3.92Zm28.8,13.6v11.36h-6.4v-11.76c-.08-2.48-1.76-4.4-4.24-4.4s-4.56,1.92-4.64,4.4v11.76h-6.4V23h6.4v3.04c1.36-2,3.6-3.28,6.16-3.28h1.76c4.08,0,7.36,3.36,7.36,7.36v3.28Z',
    ],
  },
];
