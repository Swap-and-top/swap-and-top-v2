'use client';

/**
 * RevealAction — how to get in touch with a seller.
 *
 * The seller chose, when posting, the ways they can be reached: calls,
 * WhatsApp, email, Facebook Messenger — any of them. The button is "Show
 * contact" for one way and "Show contacts" for more, carrying their icons,
 * and opens a sheet of just those ways, where each is revealed on a tap.
 *
 * Wired to `useRevealStore`, which in the real system is a server action that
 * records an event carrying the listing, a device hash, the viewer's role and
 * the promotion slot at the time. That last field is what lets promotion be
 * sold on evidence rather than on a promise. Each way is revealed on its
 * own and recorded by way — opening a chat as much as showing a number — so
 * a seller can be told how people reach them, and one way does not give
 * away the others.
 *
 * A guest can use this. There is no sign-up wall on the contact path — it is
 * the hardest rule in the product and the one most likely to be eroded by
 * reasonable-sounding requests. Two things ask a guest to sign in, and both
 * say why:
 *
 *  - the daily limit: a guest sees a few sellers' details a day, which a
 *    casual buyer never reaches and someone harvesting numbers reaches at
 *    once;
 *  - the seller's own choice to show their details to signed-in users only.
 *
 * Once a guest has what they came for, a short message offers the reason to
 * join — asked after, not before — and goes away.
 */

import { useState, type ComponentType } from 'react';
import { toast } from 'sonner';
import {
  GUEST_DAILY_REVEALS,
  contactWaysFor,
  requireSignIn,
  revealsLeft,
  useRevealStore,
  useSessionStore,
  useSignInPromptStore,
  whatsappNumberOf,
  type ContactWay,
  type ContactWays,
} from '@snt/core';
import { Button, Sheet } from '@snt/ui';
import {
  MailIcon,
  MessengerIcon,
  PhoneIcon,
  WhatsAppIcon,
} from '@snt/ui/icons';
import styles from './RevealAction.module.css';

type Way = ContactWay;

const WAYS: Record<
  Way,
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

/** The ways this seller ticked, in a fixed order. */
function waysOffered(ways: ContactWays): Way[] {
  const offered: Way[] = [];
  if (ways.call) offered.push('call');
  if (ways.whatsapp) offered.push('whatsapp');
  if (ways.email) offered.push('email');
  if (ways.messenger) offered.push('messenger');
  return offered;
}

const digitsOf = (phone: string) => phone.replace(/\D/g, '');

/** Where each way goes, once revealed. */
function hrefFor(way: Way, ways: ContactWays): string {
  switch (way) {
    case 'call':
      return `tel:+${digitsOf(ways.phone)}`;
    case 'whatsapp':
      return `https://wa.me/${digitsOf(whatsappNumberOf(ways))}`;
    case 'email':
      return `mailto:${ways.email}`;
    default:
      return ways.messenger ?? '';
  }
}

/** WhatsApp and Messenger open elsewhere; a call and an email are shown. */
const opensElsewhere = (way: Way) => way === 'whatsapp' || way === 'messenger';

export function RevealAction({
  listingId,
  ownerId,
  signedInOnly = false,
  block = true,
}: {
  listingId: string;
  ownerId: string;
  /** The seller shows their details to signed-in users only. */
  signedInOnly?: boolean;
  block?: boolean;
}) {
  const { reveal, revealed, usedToday } = useRevealStore();
  const signedIn = useSessionStore((state) => state.signedIn);
  const ask = useSignInPromptStore((state) => state.ask);
  const [open, setOpen] = useState(false);

  const ways = contactWaysFor(ownerId);
  const offered = waysOffered(ways);
  const shown = revealed[listingId] ?? [];
  /** Anything on this listing revealed already: the checks are passed. */
  const seenSeller = shown.length > 0;

  /**
   * Reveals the seller's details — through the sign-in sheet first when the
   * seller asks for that or the guest's daily limit is used. It only
   * reveals: the way's row then offers the chat, for WhatsApp and Messenger.
   */
  function use(way: Way) {
    const go = () => {
      const first = !useRevealStore.getState().isRevealed(listingId);
      reveal(listingId, ownerId, way);
      // After, not before: they have what they came for; now the reason to
      // join. A message that goes by, so nothing is left on the page.
      if (first && !useSessionStore.getState().signedIn) {
        const reason = 'Sign in to save this listing and come back to it later.';
        toast(reason, {
          action: { label: 'Sign in', onClick: () => ask({ reason }) },
        });
      }
    };

    if (seenSeller) {
      go();
      return;
    }
    if (signedInOnly) {
      requireSignIn(
        'This seller shows their contact details to signed-in users only.',
        go,
      );
      return;
    }
    if (!signedIn && revealsLeft(usedToday, false) === 0) {
      requireSignIn(
        `You have seen ${GUEST_DAILY_REVEALS} sellers’ details today, which is the limit without an account. It is there to stop sellers’ numbers being collected in bulk. Sign in to see more.`,
        go,
      );
      return;
    }
    go();
  }

  if (offered.length === 0) return null;

  // "Show contact" or "Show contacts", with the seller's ways on it. Nothing
  // is opened from here: the sheet reveals each way, and only then offers
  // the chat — no one is sent off to WhatsApp by surprise.
  return (
    <>
      {/* The seller's icons always sit in the button, beside the words.
          Several of them need a line of their own on a phone, so the
          listing's actions stack there (see ListingActions); measured, so
          a single icon can tighten to fit a half-width button. */}
      <div
        className={styles.contactWrap}
        data-stack-on-phone={offered.length > 1 ? '' : undefined}
      >
        <Button size="lg" block={block} onClick={() => setOpen(true)}>
          {offered.length === 1 ? 'Show contact' : 'Show contacts'}
          <span className={styles.wayIcons} aria-hidden>
            {offered.map((way) => {
              const { Icon } = WAYS[way];
              // A line of exactly 1px: the icons are drawn on a 24-unit grid.
              return <Icon key={way} size={22} weight={24 / 22} />;
            })}
          </span>
        </Button>
      </div>

      {open ? (
        <Sheet narrow title="Contact the seller" onClose={() => setOpen(false)}>
          <ul className={styles.list}>
            {offered.map((way) => (
              <li key={way}>
                <WayRow
                  way={way}
                  ways={ways}
                  revealed={shown.includes(way)}
                  onUse={() => use(way)}
                />
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Meet in public, and check the item before you pay.
          </p>
        </Sheet>
      ) : null}
    </>
  );
}

/**
 * One way in the sheet. Until it is revealed it says what a tap does; after,
 * it shows its own number or address, and is a link straight to it. The
 * other ways stay as they were.
 */
function WayRow({
  way,
  ways,
  revealed,
  onUse,
}: {
  way: Way;
  ways: ContactWays;
  revealed: boolean;
  onUse: () => void;
}) {
  const { label, does, Icon } = WAYS[way];
  const detail =
    way === 'email'
      ? ways.email
      : way === 'whatsapp'
        ? whatsappNumberOf(ways)
        : way === 'messenger'
          ? messengerName(ways.messenger)
          : ways.phone;

  const head = (
    <>
      <span className={styles.rowIcon}>
        <Icon size={20} weight={24 / 20} />
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

  // WhatsApp and Messenger: the number or name, and a small link into the
  // chat beside it.
  if (opensElsewhere(way)) {
    return (
      <div className={className}>
        {head}
        <span className={styles.rowDetail}>{detail}</span>
        <a
          href={hrefFor(way, ways)}
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
      <span className={styles.rowDetail}>{detail}</span>
    </a>
  );
}

/** The name at the end of a Messenger link: m.me/kopje.example → kopje.example. */
function messengerName(link?: string): string | undefined {
  if (!link) return undefined;
  return link.replace(/\/+$/, '').split('/').pop();
}
