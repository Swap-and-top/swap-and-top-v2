'use client';

/**
 * Footer — the site's foot, on the brand gradient in white: the logo and our
 * social links, quick links, and how to reach the company; then, under a thin
 * line, who owns the product and the copyright.
 *
 * On a phone the sections stack, lined up on the left; from tablet up they
 * sit in three columns over a bottom bar.
 *
 * On pages with an end to reach: sign in, your profile, and the help and
 * legal pages. Never on the feed or other lists that keep loading.
 */

import Link from 'next/link';
import { COMPANY, telHref } from '@snt/core';
import { MailIcon, PhoneIcon, PinIcon } from '../icons';
import { HomeLink } from './HomeLink';
import { CompactLogo } from './Logo';
import { SocialMark } from './SocialMarks';
import styles from './Footer.module.css';

const LINKS = [
  { href: '/', label: 'Homepage' },
  { href: '/help', label: 'Safety tips' },
  { href: '/terms', label: 'Terms of use' },
  { href: '/privacy', label: 'Privacy policy' },
];

export function Footer() {
  const year = new Date().getFullYear();
  const phone = COMPANY.phones[0];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          {/* The logo, with our socials under it. */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label="Swap & Top home">
              {/* The compact, stacked logo, as on the sign in sheet, but in
                  plain white on the gradient. */}
              <CompactLogo height={48} />
            </Link>
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

          <nav className={styles.section} aria-label="Quick links">
            <h3 className={styles.title}>Quick links</h3>
            <ul className={styles.list}>
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  {/* Homepage lands on All, as the header's logo does. */}
                  {href === '/' ? (
                    <HomeLink className={styles.link}>{label}</HomeLink>
                  ) : (
                    <Link href={href} className={styles.link}>
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.section}>
            <h3 className={styles.title}>Contact us</h3>
            <ul className={styles.list}>
              {/* The phone and the email are links, icon and all: both turn
                  yellow together on hover. */}
              <li>
                <a href={telHref(phone)} className={[styles.contact, styles.contactLink].join(' ')}>
                  <span className={styles.contactIcon}>
                    <PhoneIcon size={16} />
                  </span>
                  {phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className={[styles.contact, styles.contactLink].join(' ')}
                >
                  <span className={styles.contactIcon}>
                    <MailIcon size={16} />
                  </span>
                  {COMPANY.email}
                </a>
              </li>
              <li className={styles.contact}>
                <span className={styles.contactIcon}>
                  <PinIcon size={16} />
                </span>
                <span>{COMPANY.address.join(', ')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Under a thin line: who owns the product, and the copyright. */}
        <div className={styles.bottom}>
          <p>© {year} {COMPANY.name} All rights reserved.</p>
          <p className={styles.disclosure}>
            Swap &amp; Top is a product owned and operated by {COMPANY.legalName}.
          </p>
        </div>
      </div>
    </footer>
  );
}
