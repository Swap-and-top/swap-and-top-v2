'use client';

/**
 * OfferSheet — where an offer is made, and looked at again afterwards.
 *
 * It opens over the listing rather than on a page of its own, so the thing
 * being answered stays in sight: a sheet rising from the bottom of a phone,
 * a panel in the middle of a wider screen.
 *
 * The form is one short screen and arrives mostly filled in — what they are
 * asking, an item of yours to put forward, the cash as they asked for it —
 * because it has to be quicker than writing the same thing out on WhatsApp.
 * An offer is not binding; it starts the conversation.
 *
 * If you have already made an offer here, the sheet shows that instead, with
 * the option to withdraw it.
 */

import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  CONDITION_LABELS,
  contactWaysFor,
  useLiveListings,
  myOfferOn,
  requireSignIn,
  sendOfferOptimistically,
  useOfferStore,
  useViewerId,
  type Category,
  type Listing,
  type Condition,
  type ContactWay,
  type OfferableListing,
  type OfferItem,
} from '@snt/core';
import { WAY_META, waysOffered } from '../contact/ContactWays';
import { BinocularsIcon, CashHandIcon, TagIcon } from '../icons';
import { Button } from '../primitives/Button';
import { Dropdown } from '../primitives/Dropdown';
import { Sheet, useCloseSheet } from '../primitives/Sheet';
import { OfferCard } from './OfferCard';
import { askParts, cashSetup, isPriceOffer } from './offerWords';
import styles from './Offers.module.css';

const MESSAGE_MAX = 200;


/** Things of the current user's that could be put forward: what they sell,
 *  and what they have up for a swap. */
function ownItems(
  live: Listing[],
  userId: string | undefined,
  except: string,
): (OfferItem & { category: Category })[] {
  if (!userId) return [];
  return live
    .filter((listing) => listing.ownerId === userId && listing.id !== except)
    .flatMap((listing) => {
      const item =
        listing.type === 'sale'
          ? listing.item
          : listing.type === 'swap'
            ? listing.has
            : undefined;
      return item
        ? [
            {
              listingId: listing.id,
              name: item.name,
              condition: item.condition,
              category: item.category,
            },
          ]
        : [];
    });
}

export function OfferSheet({
  listing,
  onClose,
}: {
  listing: OfferableListing;
  onClose: () => void;
}) {
  const offers = useOfferStore((store) => store.offers);
  const mine = myOfferOn(offers, listing.id, useViewerId());
  const ask = askParts(listing);
  const forSale = listing.type === 'sale';

  return (
    <Sheet
      title={forSale ? `Swap for: ${ask.item}` : `Wanted item: ${ask.item}`}
      // What is being answered heads the sheet, first and largest: the item
      // wanted, then its terms. Everything under it is what you offer for it.
      heading={
        <div
          className={[styles.ask, forSale ? styles.askSale : '']
            .filter(Boolean)
            .join(' ')}
        >
          {/* Marked as on its card in the feed: Wanted in green; a sale,
              which a trade in is offered towards, in the blue of For sale. */}
          <span className={styles.askLabel}>
            <span className={styles.labelIcon}>
              {forSale ? <TagIcon size={16} /> : <BinocularsIcon size={16} />}
            </span>
            {forSale ? 'For sale' : 'Wanted'}
          </span>
          {/* The item, with its budget or terms under it. */}
          <span className={styles.askLine}>
            <span className={styles.askItem}>{ask.item}</span>
            <span className={styles.askTerms}>{ask.terms}</span>
          </span>
        </div>
      }
      onClose={onClose}
    >
      {mine ? (
        <div className={[styles.inSheet, styles.form].join(' ')}>
          <h3 className={styles.formTitle}>
            <span className={styles.labelIcon}>
              <CashHandIcon size={17} filled={false} />
            </span>
            Your offer
          </h3>
          <OfferCard offer={mine} view="made" />
        </div>
      ) : (
        <OfferForm listing={listing} />
      )}
    </Sheet>
  );
}

/**
 * Sizes a message box to what is in it: never shorter than its three rows,
 * never taller than its CSS max-height, past which it scrolls inside.
 */
function fitToText(box: HTMLTextAreaElement) {
  box.style.height = 'auto';
  box.style.height = `${box.scrollHeight}px`;
}

function OfferForm({ listing }: { listing: OfferableListing }) {
  // Sent, the sheet sinks away like any other close.
  const onSent = useCloseSheet();
  const viewer = useViewerId();
  const own = ownItems(useLiveListings(), viewer, listing.id);
  /** The ways on the offerer's account, and which of them this offer uses:
      just the first, WhatsApp where they have it, until they pick more. It
      starts with one so it is plain the others can be added. */
  const myWays = viewer ? waysOffered(contactWaysFor(viewer)) : [];
  const [reachOn, setReachOn] = useState<ContactWay[] | null>(null);
  const chosenWays = reachOn ?? myWays.slice(0, 1);
  const setup = cashSetup(listing);
  const priced = isPriceOffer(listing);

  // Start on one of their own listings only if it is the kind of thing being
  // asked for — then there is nothing to type. Otherwise start on "describe
  // it": a laptop must never be one careless tap from answering a request
  // for a graphics card.
  const wantedCategory =
    listing.type === 'sale' ? listing.item.category : listing.wants.category;
  const fits = own.find((candidate) => candidate.category === wantedCategory);
  const [mode, setMode] = useState<'listing' | 'describe'>(
    fits ? 'listing' : 'describe',
  );
  const [pickedId, setPickedId] = useState(fits?.listingId ?? own[0]?.listingId);
  const [name, setName] = useState('');
  const [condition, setCondition] = useState<Condition | ''>('');
  const [cash, setCash] = useState(setup.amount);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const conditionLabel = useId();
  const listingLabel = useId();

  const describing = mode === 'describe';
  const picked = own.find((candidate) => candidate.listingId === pickedId);
  const item: OfferItem | undefined = describing
    ? name.trim()
      ? { name: name.trim(), condition: condition || undefined }
      : undefined
    : picked && {
        listingId: picked.listingId,
        name: picked.name,
        condition: picked.condition,
      };

  const amount = Number(cash || 0);
  // A price is required; cash on a swap can be nothing at all.
  const ready = Boolean(item) && (!priced || amount > 0) && !sending;

  // A guest can fill the whole form in first. Sending is what needs an
  // account: they are asked to sign in then, and the offer goes once they
  // have — nothing they typed is lost.
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!item || !ready) return;
    requireSignIn('Sign in to send your offer.', () => void send());
  }

  async function send() {
    if (!item) return;
    setSending(true);
    try {
      await sendOfferOptimistically({
        listingId: listing.id,
        item,
        cashAmount: amount,
        cashFrom: amount > 0 ? setup.from : 'none',
        message: message.trim() || undefined,
        // A guest signs in only as they send, so they have no ways yet on
        // screen: then it is left to their account's own.
        reachOn: chosenWays.length > 0 ? chosenWays : undefined,
      });
      toast.success('Offer sent');
      onSent();
    } catch {
      toast.error('Your offer was not sent. Try again.');
      setSending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {/* Marked like the WANTED label above it: a hand held out, offering
          something, outlined on its tile, in the blue of what is yours. */}
      <h3 className={styles.formTitle}>
        <span className={styles.labelIcon}>
          <CashHandIcon size={17} filled={false} />
        </span>
        {listing.type === 'sale' ? 'Offer a swap' : 'Make an offer'}
      </h3>

      <fieldset className={styles.group}>
        <legend className={[styles.label, styles.flush].join(' ')}>What you are offering</legend>
        {/* Two ways to say what you are offering, side by side: pick one,
            and only what that one needs shows under them. Both need one
            label and one row, so switching moves nothing below. */}
        <div className={styles.modes}>
          <label
            className={[styles.mode, own.length === 0 ? styles.modeOff : '']
              .filter(Boolean)
              .join(' ')}
          >
            <input
              type="radio"
              name="offer-item"
              checked={!describing}
              disabled={own.length === 0}
              onChange={() => setMode('listing')}
            />
            <span>One of my listings</span>
          </label>
          <label className={styles.mode}>
            <input
              type="radio"
              name="offer-item"
              checked={describing}
              onChange={() => setMode('describe')}
            />
            <span>Describe what you’re offering</span>
          </label>
        </div>

        {/* Under the choice, only what it needs — each way two rows, so
            switching moves nothing below. Describing: the item the full
            width, then its condition and the cash half and half. From your
            listings: which one, then the cash. */}
        {describing ? (
          <>
            <label className={styles.field}>
              <span className={styles.label}>Item</span>
              <input
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Dell Latitude 7490, i7"
                maxLength={60}
                autoComplete="off"
              />
            </label>
            <div className={styles.pair}>
              <div className={styles.field}>
                <span id={conditionLabel} className={styles.label}>
                  Condition
                </span>
                <Dropdown<Condition | ''>
                  labelledBy={conditionLabel}
                  value={condition}
                  onChange={setCondition}
                  options={[
                    { value: '', label: 'Not stated' },
                    ...(Object.keys(CONDITION_LABELS) as Condition[]).map(
                      (value) => ({ value, label: CONDITION_LABELS[value] }),
                    ),
                  ]}
                />
              </div>
              <label className={styles.field}>
              <span className={styles.label}>
                {setup.label}
                {setup.optional ? (
                  <>
                    {' '}
                    <span className={styles.optional}>(optional)</span>
                  </>
                ) : null}
              </span>
              <span className={styles.money}>
                <span aria-hidden>$</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={cash}
                  onChange={(event) =>
                    setCash(event.target.value.replace(/[^0-9]/g, ''))
                  }
                  placeholder="0"
                  maxLength={6}
                />
              </span>
            </label>
            </div>
          </>
        ) : (
          <>
            <div className={styles.field}>
              <span id={listingLabel} className={styles.label}>
                Which listing
              </span>
              {/* One line however many there are; opens to show them all. */}
              <Dropdown
                labelledBy={listingLabel}
                value={pickedId}
                onChange={setPickedId}
                options={own.flatMap((candidate) =>
                  candidate.listingId
                    ? [
                        {
                          value: candidate.listingId,
                          label: candidate.name,
                          note: candidate.condition
                            ? `Your listing · ${CONDITION_LABELS[candidate.condition]}`
                            : 'Your listing',
                        },
                      ]
                    : [],
                )}
              />
            </div>
            <label className={styles.field}>
              <span className={styles.label}>
                {setup.label}
                {setup.optional ? (
                  <>
                    {' '}
                    <span className={styles.optional}>(optional)</span>
                  </>
                ) : null}
              </span>
              <span className={styles.money}>
                <span aria-hidden>$</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={cash}
                  onChange={(event) =>
                    setCash(event.target.value.replace(/[^0-9]/g, ''))
                  }
                  placeholder="0"
                  maxLength={6}
                />
              </span>
            </label>
          </>
        )}
      </fieldset>

      <label className={styles.field}>
        <span className={styles.label}>
          Message <span className={styles.optional}>(optional)</span>
        </span>
        {/* Grows a line at a time as it is filled, up to a set height —
            past that it scrolls inside itself, so the sheet never grows
            past the screen. */}
        <textarea
          className={[styles.input, styles.textarea].join(' ')}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            fitToText(event.currentTarget);
          }}
          placeholder="Any extra information"
          maxLength={MESSAGE_MAX}
          rows={3}
        />
      </label>

      {/* How the owner can reach them if they accept: the ways on their
          account, all of them unless they choose fewer for this offer. It
          is shown to the owner only once the offer is accepted. */}
      {myWays.length > 0 ? (
        <div className={[styles.field, styles.waysField].join(' ')}>
          {/* At the edge, like "What you are offering": it heads pills, not
              a text box. */}
          <span className={[styles.label, styles.flush].join(' ')}>
            They can reach you on{' '}
            {/* How many are on, so it is plain the pills can be tapped. */}
            <span className={styles.optional}>
              ({chosenWays.length} selected)
            </span>
          </span>
          {/* Always the pills: a tap switches a way on or off for this
              offer, with nothing to open first. */}
          <div className={styles.waysPick}>
            {myWays.map((way) => {
              const { label, Icon } = WAY_META[way];
              const on = chosenWays.includes(way);
              // At least one way stays on: an accepted offer must lead
              // somewhere.
              const last = on && chosenWays.length === 1;
              return (
                <button
                  key={way}
                  type="button"
                  className={[styles.wayToggle, on ? styles.wayOn : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={on}
                  disabled={last}
                  onClick={() =>
                    setReachOn(
                      on
                        ? chosenWays.filter((w) => w !== way)
                        : myWays.filter(
                            (w) => w === way || chosenWays.includes(w),
                          ),
                    )
                  }
                >
                  <Icon size={16} weight={24 / 16} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <Button type="submit" size="lg" block disabled={!ready} loading={sending}>
        Send offer
      </Button>
      <p className={styles.small}>
        Not binding. The owner compares offers side by side, and you settle
        the rest between you · meet in public, check the device first.
      </p>
    </form>
  );
}
