'use client';

/**
 * The ways to reach someone: WhatsApp, a call, email, Messenger.
 *
 * Shared by the contact sheet on a listing, where each way is revealed on a
 * tap, and the introduction on an accepted offer, where they are shown at
 * once. The same rows, icons and colours in both, so a way looks the same
 * wherever it is offered.
 */

import type { ComponentType } from 'react';
import {
  whatsappNumberOf,
  type ContactWay,
  type ContactWays,
} from '@snt/core';
import { MailIcon, MessengerIcon, PhoneIcon, WhatsAppIcon } from '../icons';
import styles from './ContactWays.module.css';

export const WAY_META: Record<
  ContactWay,
  {
    label: string;
    /** What a tap does, before anything is revealed. */
    does: string;
    Icon: ComponentType<{ size?: number; weight?: number }>;
  }
> = {
  call: { label: 'Call', does: 'Reveal number', Icon: PhoneIcon },
  whatsapp: { label: 'WhatsApp', does: 'Reveal number', Icon: WhatsAppIcon },
  email: { label: 'Email', does: 'Reveal address', Icon: MailIcon },
  messenger: { label: 'Messenger', does: 'Reveal username', Icon: MessengerIcon },
};

/** The order ways are always listed in: WhatsApp first, as most people here
    reach for it, then calls, email and Messenger. */
export const WAY_ORDER: ContactWay[] = ['whatsapp', 'call', 'email', 'messenger'];

/** The ways someone has given, in that order. */
export function waysOffered(ways: ContactWays): ContactWay[] {
  return WAY_ORDER.filter((way) => {
    if (way === 'whatsapp') return ways.whatsapp;
    if (way === 'call') return ways.call;
    if (way === 'email') return Boolean(ways.email);
    return Boolean(ways.messenger);
  });
}

const digitsOf = (phone: string) => phone.replace(/\D/g, '');

/** Where a way goes. WhatsApp can carry a first message, ready to send. */
function hrefFor(way: ContactWay, ways: ContactWays, message?: string): string {
  switch (way) {
    case 'call':
      return `tel:+${digitsOf(ways.phone)}`;
    case 'whatsapp': {
      const base = `https://wa.me/${digitsOf(whatsappNumberOf(ways))}`;
      return message ? `${base}?text=${encodeURIComponent(message)}` : base;
    }
    case 'email':
      return `mailto:${ways.email}`;
    default:
      return ways.messenger ?? '';
  }
}

/** The name at the end of a Messenger link: m.me/kopje.example → kopje.example. */
function messengerName(link?: string): string | undefined {
  if (!link) return undefined;
  return link.replace(/\/+$/, '').split('/').pop();
}

/** What a way shows once revealed: its number, address or username. */
function detailOf(way: ContactWay, ways: ContactWays): string | undefined {
  if (way === 'email') return ways.email;
  if (way === 'whatsapp') return whatsappNumberOf(ways);
  if (way === 'messenger') return messengerName(ways.messenger);
  return ways.phone;
}

/** WhatsApp and Messenger open elsewhere; a call and an email are shown. */
const opensElsewhere = (way: ContactWay) =>
  way === 'whatsapp' || way === 'messenger';

/**
 * One way. Until it is revealed it says what a tap does; after, it shows its
 * own number or address, and is a link straight to it, with "Open chat" for
 * WhatsApp and Messenger.
 */
export function ContactWayRow({
  way,
  ways,
  revealed,
  onUse,
  message,
}: {
  way: ContactWay;
  ways: ContactWays;
  revealed: boolean;
  /** A tap on a way not yet revealed. */
  onUse?: () => void;
  /** A first WhatsApp message, ready to send. */
  message?: string;
}) {
  const { label, does, Icon } = WAY_META[way];

  const head = (
    <>
      <span className={styles.rowIcon}>
        <Icon size={18} />
      </span>
      <span className={styles.rowLabel}>{label}</span>
    </>
  );
  const className = [styles.row, styles[way]].join(' ');

  if (!revealed) {
    return (
      <button type="button" className={className} onClick={onUse}>
        {head}
        <span className={styles.rowDoes}>{does}</span>
      </button>
    );
  }

  if (opensElsewhere(way)) {
    return (
      <div className={className}>
        {head}
        <span className={styles.rowDetail}>{detailOf(way, ways)}</span>
        <a
          href={hrefFor(way, ways, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openChat}
        >
          Open chat
        </a>
      </div>
    );
  }

  // A call or an email: the whole row rings or writes.
  return (
    <a href={hrefFor(way, ways)} className={className}>
      {head}
      <span className={styles.rowDetail}>{detailOf(way, ways)}</span>
    </a>
  );
}

/** Several ways, as a list of rows. */
export function ContactWayList({
  ways,
  only,
  revealed,
  onUse,
  message,
}: {
  ways: ContactWays;
  /** The ways to list, in order; all the ones given, by default. */
  only?: ContactWay[];
  /** Which are revealed: all of them, or those named. */
  revealed: true | ContactWay[];
  onUse?: (way: ContactWay) => void;
  message?: string;
}) {
  const listed = only ?? waysOffered(ways);
  return (
    <ul className={styles.list}>
      {listed.map((way) => (
        <li key={way}>
          <ContactWayRow
            way={way}
            ways={ways}
            revealed={revealed === true || revealed.includes(way)}
            onUse={onUse ? () => onUse(way) : undefined}
            message={message}
          />
        </li>
      ))}
    </ul>
  );
}
