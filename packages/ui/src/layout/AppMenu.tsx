'use client';

/**
 * AppMenu — everything that is not browsing, from the account circle at the
 * top right of the header: your profile, help and the rules,
 * and how to reach Swap & Top. Signed out, a way to sign in heads it instead.
 *
 * On a laptop it drops down under the circle; on a phone it slides in from
 * the right, the full height of the screen, over a dimmed page, as the
 * header's three lines turn into its cross. A tap outside, the cross,
 * Escape, or opening a link closes it.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  COMPANY,
  getUser,
  telHref,
  useDealStore,
  useSessionStore,
  useViewerId,
} from '@snt/core';
import {
  CloseIcon,
  PhoneIcon,
  PinIcon,
} from '../icons';
import { Button, ButtonLink } from '../primitives/Button';
import { Avatar } from '../primitives/Placeholder';
import { ConfirmedDealsBadge } from '../primitives/Trust';
import { SocialMark } from './SocialMarks';
import { BurgerLines } from './BurgerLines';
import { GuestMark } from './GuestMark';
import { PrivacyMark, TermsMark, TipsMark } from './HelpMarks';
import styles from './AppMenu.module.css';

/** How long the menu takes to go, so it can slide or fade away first. */
const CLOSE_MS = 260;

export function AppMenu({
  anchor,
  onClose,
}: {
  /** The account circle it drops from, on a laptop. */
  anchor: HTMLElement | null;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [place, setPlace] = useState<{ top: number; right: number } | null>(null);
  /** Where the header's button is: on a phone the cross is drawn there. */
  const [button, setButton] = useState<DOMRect | null>(null);
  /** The phone's lines, crossed once the menu is in, uncrossed as it goes. */
  const [crossed, setCrossed] = useState(false);
  const opened = useRef(pathname);

  function close() {
    if (closing) return;
    setClosing(true);
    setCrossed(false);
    window.setTimeout(onClose, CLOSE_MS);
  }

  // Under the circle, right edges level, on a laptop; measured again as the
  // window is resized, so the menu moves with the circle it came from.
  useEffect(() => {
    if (!anchor) return;
    const measure = () => {
      const at = anchor.getBoundingClientRect();
      setPlace({ top: at.bottom + 10, right: Math.max(12, window.innerWidth - at.right) });
      setButton(at);
    };
    measure();
    window.addEventListener('resize', measure);
    // The page's own width too, which follows the window at once.
    const watcher = new ResizeObserver(measure);
    watcher.observe(document.documentElement);
    // Drawn as three lines first, then crossed, so the change is seen.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setCrossed(true));
    });
    return () => {
      window.removeEventListener('resize', measure);
      watcher.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [anchor]);

  // Closes on a move to another page, Escape, or a tap outside.
  useEffect(() => {
    if (pathname !== opened.current) onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || anchor?.contains(target)) return;
      if ((target as Element).closest?.('[data-menu-toggle]')) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    // On a phone the page behind stays still while the menu is open.
    const phone = window.matchMedia('(max-width: 767px)').matches;
    const before = document.body.style.overflow;
    if (phone) document.body.style.overflow = 'hidden';
    panel.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
      document.body.style.overflow = before;
    };
    // `close` reads the latest state itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  return createPortal(
    <>
      <div
        className={[styles.backdrop, closing ? styles.backdropClosing : '']
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-label="Menu"
        tabIndex={-1}
        className={[styles.panel, closing ? styles.panelClosing : '']
          .filter(Boolean)
          .join(' ')}
        style={
          place
            ? ({
                '--menu-top': `${place.top}px`,
                '--menu-right': `${place.right}px`,
                '--toggle-bottom': button ? `${button.bottom}px` : undefined,
              } as React.CSSProperties)
            : undefined
        }
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Close the menu"
          onClick={close}
        >
          <CloseIcon size={18} />
        </button>
        <MenuContent onNavigate={close} />
      </div>
      {/* On a phone: the header button's three lines, drawn over the menu in
          the same place, crossing to close it. */}
      {button ? (
        <button
          type="button"
          data-menu-toggle
          className={[styles.toggle, crossed ? styles.toggleCrossed : '']
            .filter(Boolean)
            .join(' ')}
          style={{
            top: button.top,
            left: button.left,
            width: button.width,
            height: button.height,
          }}
          aria-label="Close the menu"
          onClick={close}
        >
          <BurgerLines cross={crossed} />
        </button>
      ) : null}
    </>,
    document.body,
  );
}

function MenuContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const signedIn = useSessionStore((state) => state.signedIn);
  const signOut = useSessionStore((state) => state.signOut);
  const viewerId = useViewerId();
  const user = viewerId ? getUser(viewerId) : undefined;
  const { confirmedDeals } = useDealStore();
  const next = pathname && pathname !== '/signin' ? pathname : '/';
  const year = new Date().getFullYear();

  return (
    <div className={styles.content}>
      {/* White: who you are, or a way in. */}
      <section
        className={[styles.profileBand, signedIn && user ? '' : styles.guest]
          .filter(Boolean)
          .join(' ')}
      >
        {signedIn && user ? (
          <>
            <div className={styles.who}>
              <span className={styles.whoAvatar}>
                <Avatar size={56} initials={initialsOf(user.displayName)} />
              </span>
              <div className={styles.whoText}>
                <span className={styles.name}>{user.displayName}</span>
                <ConfirmedDealsBadge count={confirmedDeals} size="md" long />
              </div>
            </div>
            <div className={styles.pair}>
              <ButtonLink href="/me" variant="secondary" size="md" onClick={onNavigate}>
                View profile
              </ButtonLink>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  // The menu goes first, still showing you; you are signed
                  // out once it has gone, so it never flips to the signed
                  // out view as it fades.
                  onNavigate();
                  window.setTimeout(signOut, CLOSE_MS);
                }}
              >
                Sign out
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* The signed out mark and the welcome: side by side from tablet
                up, as a signed in picture and name are; on a phone, the mark
                large and centred above the welcome. */}
            <div className={styles.guestWho}>
              <span className={styles.guestMark}>
                <GuestMark size={80} strokeWidth={4} />
              </span>
              <div className={styles.guestText}>
                <p className={styles.name}>Welcome to Swap &amp; Top</p>
                <p className={styles.welcomeNote}>
                  Sign in to post, save listings, and send and receive offers.
                </p>
              </div>
            </div>
            <ButtonLink
              href={`/signin?next=${encodeURIComponent(next)}`}
              size="md"
              block
              className={styles.signInButton}
              onClick={onNavigate}
            >
              Sign in
            </ButtonLink>
          </>
        )}
      </section>

      {/* Green: help and the rules, in yellow. */}
      <nav className={`${styles.band} ${styles.helpBand}`} aria-label="Help">
        <MenuRow href="/help" icon={<TipsMark />} label="Safety and how to swap" onNavigate={onNavigate} />
        <MenuRow href="/terms" icon={<TermsMark />} label="Terms of use" onNavigate={onNavigate} />
        <MenuRow href="/privacy" icon={<PrivacyMark />} label="Privacy policy" onNavigate={onNavigate} />
      </nav>

      {/* Light blue: call us, find us, side by side. */}
      <section className={`${styles.band} ${styles.contactBand}`} aria-label="Contact us">
        <div className={styles.contact}>
          <span className={styles.contactIcon}>
            <PhoneIcon size={18} />
          </span>
          <div className={styles.contactLines}>
            {COMPANY.phones.map((phone) => (
              <a key={phone} href={telHref(phone)} className={styles.contactLink}>
                {phone}
              </a>
            ))}
          </div>
        </div>
        <div className={styles.contact}>
          <span className={styles.contactIcon}>
            <PinIcon size={18} />
          </span>
          <div className={styles.contactLines}>
            {COMPANY.address.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Deep blue: feedback, socials, the company. */}
      <section className={`${styles.band} ${styles.socialBand}`} aria-label="Feedback and social">
        <div className={styles.feedback}>
          <p>Your feedback matters to us. Email us at</p>
          <a href={`mailto:${COMPANY.feedbackEmail}`} className={styles.yellowLink}>
            {COMPANY.feedbackEmail}
          </a>
        </div>
        <div className={styles.socialsWrap}>
          <p>Find us on social</p>
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
        <p className={styles.disclosure}>
          Swap &amp; Top is a product owned and operated by {COMPANY.legalName}.
        </p>
        <p className={styles.copyright}>
          © {year} | {COMPANY.name}
        </p>
      </section>
    </div>
  );
}

/** A link in the green band: the icon and the name, in yellow. */
function MenuRow({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link href={href} className={styles.row} onClick={onNavigate}>
      <span className={styles.rowIcon}>{icon}</span>
      <span>{label}</span>
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
