'use client';

/**
 * RevealAction — how to get in touch with a seller.
 *
 * The seller chose, when posting, the ways they can be reached: calls,
 * WhatsApp, email, Facebook Messenger — any of them. The button is "Show
 * contact" for one way and "Show contacts" for more, carrying their icons,
 * and opens a sheet of just those ways, where each is revealed on a tap.
 *
 * Each way revealed is recorded through the API (`recordReveal`), which keeps
 * the listing, a device hash, who it was when signed in and the promotion
 * slot at the time, counts the daily limit, and starts the deal check;
 * `useRevealStore` keeps what this browser has revealed. That last field is what lets promotion be
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
 * A poster can also keep their details back until they accept an offer
 * (`contactShownTo: 'offers'`). Then there is no button at all for anyone
 * whose offer has not been accepted; see `useContactKeptBack`.
 *
 * Once a guest has what they came for, a short message offers the reason to
 * join — asked after, not before — and goes away.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GUEST_DAILY_REVEALS,
  contactAfterOffer,
  contactWaysFor,
  requireSignIn,
  revealsLeft,
  useRevealStore,
  useSessionStore,
  useSignInPromptStore,
  useOfferStore,
  useViewerId,
  type ContactChannel,
  type ContactWay,
  type ContactWays,
  type Listing,
} from '@snt/core';
import { Button, ContactWayList, Sheet, WAY_META, waysOffered } from '@snt/ui';
import { recordReveal, revealStoreContact } from '@/lib/reveals';
import styles from './RevealAction.module.css';

/**
 * Whether the poster's details are kept back from this viewer: the listing
 * shows them only to people whose offer was accepted, and theirs has not
 * been (or they have made none, or are signed out).
 */
export function useContactKeptBack(listing: Listing): boolean {
  const viewer = useViewerId();
  const offers = useOfferStore((store) => store.offers);
  if (!contactAfterOffer(listing)) return false;
  const accepted = offers.some(
    (offer) =>
      offer.listingId === listing.id &&
      offer.fromUserId === viewer &&
      offer.state === 'accepted',
  );
  return !accepted;
}

/** What stands in for the contact line on such a listing. */
export const KEPT_BACK_NOTE =
  'Contact details are shared once your offer is accepted · meet in public';

export function RevealAction({
  listingId,
  ownerId,
  channels,
  storeId,
  signedInOnly = false,
  block = true,
  size = 'lg',
}: {
  listingId: string;
  ownerId: string;
  /** The ways the listing offers. Without them (a sample, not in the
      database), the sample details are used. */
  channels?: ContactChannel[];
  /** On a store's own page: the store's number, not a listing's. */
  storeId?: string;
  /** The seller shows their details to signed-in users only. */
  signedInOnly?: boolean;
  block?: boolean;
  /** Smaller where it sits beside a name, as on a lead in the console. */
  size?: 'sm' | 'md' | 'lg';
}) {
  const { reveal, revealed, usedToday, contacts, setContact } = useRevealStore();
  const signedIn = useSessionStore((state) => state.signedIn);
  const ask = useSignInPromptStore((state) => state.ask);
  const [open, setOpen] = useState(false);

  // The real details once revealed; until then only which ways there are.
  // Calls and WhatsApp are the ways the database holds a number for.
  const ways: ContactWays =
    contacts[listingId] ??
    (channels
      ? { phone: '', call: channels.includes('call'), whatsapp: channels.includes('whatsapp') }
      : contactWaysFor(ownerId));
  const offered = waysOffered(ways);
  const shown = revealed[listingId] ?? [];
  /** Anything on this listing revealed already: the checks are passed. */
  const seenSeller = shown.length > 0;

  /** Records the reveal and brings back the seller's details, as a
      mutation. A daily limit or the seller's own rules come back as an
      answer, not a failure. */
  const record = useMutation({
    mutationFn: async (way: ContactWay) =>
      storeId ? { refused: undefined, ...(await revealStoreContact(storeId)) } : recordReveal(listingId, way),
  });

  /**
   * Reveals the seller's details — through the sign-in sheet first when the
   * seller asks for that or the guest's daily limit is used. It only
   * reveals: the way's row then offers the chat, for WhatsApp and Messenger.
   */
  function use(way: ContactWay) {
    const go = async () => {
      const first = !useRevealStore.getState().isRevealed(listingId);
      // Recorded first: the API holds the daily limit.
      const { limited, refused, failed, contact } = await record.mutateAsync(way);
      if (limited) {
        if (useSessionStore.getState().signedIn) toast.error(limited);
        else requireSignIn(limited, () => void go());
        return;
      }
      if (refused || failed) {
        toast.error(refused ?? failed);
        return;
      }
      if (contact === null) {
        toast.error('This seller has not added a phone number yet.');
        return;
      }
      // The number from the API; a sample listing keeps its sample details.
      if (!useRevealStore.getState().contacts[listingId]) {
        setContact(listingId, contact ?? contactWaysFor(ownerId));
      }
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
      void go();
      return;
    }
    if (signedInOnly) {
      requireSignIn(
        'This seller shows their contact details to signed in users only.',
        () => void go(),
      );
      return;
    }
    if (!signedIn && revealsLeft(usedToday, false) === 0) {
      requireSignIn(
        `You have seen ${GUEST_DAILY_REVEALS} sellers’ details today, which is the limit without an account. It is there to stop sellers’ numbers being collected in bulk. Sign in to see more.`,
        () => void go(),
      );
      return;
    }
    void go();
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
        className={[styles.contactWrap, size === 'sm' ? styles.fit : '']
          .filter(Boolean)
          .join(' ')}
        data-stack-on-phone={offered.length > 1 ? '' : undefined}
      >
        <Button size={size} block={block} onClick={() => setOpen(true)}>
          {offered.length === 1 ? 'Show contact' : 'Show contacts'}
          <span className={styles.wayIcons} aria-hidden>
            {offered.map((way) => {
              const { Icon } = WAY_META[way];
              // A line of exactly 1px: the icons are drawn on a 24-unit grid.
              const px = size === 'lg' ? 22 : size === 'md' ? 18 : 16;
              return <Icon key={way} size={px} weight={24 / px} />;
            })}
          </span>
        </Button>
      </div>

      {open ? (
        <Sheet narrow title="Contact the seller" onClose={() => setOpen(false)}>
          <ContactWayList
            ways={ways}
            only={offered}
            revealed={shown}
            onUse={use}
          />
          <p className={styles.note}>
            Meet in public, and check the item before you pay.
          </p>
        </Sheet>
      ) : null}
    </>
  );
}
