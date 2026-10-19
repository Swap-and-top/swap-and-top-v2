'use client';

/**
 * Footer — the site's foot, as the first app had it: on the brand gradient,
 * the logo, quick links, how to reach the company, its social links; and
 * under it, on the page, the copyright line.
 *
 * Only on pages that stand apart from the feed for now — the sign-in page.
 */

import Link from 'next/link';
import { COMPANY } from '@snt/core';
import { CompactLogo, Logo } from './Logo';
import { SocialMark } from './SocialMarks';
import styles from './Footer.module.css';

const LINKS = [
  { href: '/', label: 'Homepage' },
  { href: '/help', label: 'Safety and how to swap' },
  { href: '/terms', label: 'Terms of use' },
  { href: '/privacy', label: 'Privacy policy' },
];

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
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={styles.link}>
                {label}
              </Link>
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
              {COMPANY.socials.map(({ name, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className={styles.social}
                >
                  <SocialMark name={name} />
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
