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

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  CONDITION_LABELS,
  CURRENT_USER_ID,
  liveListings,
  myOfferOn,
  sendOfferOptimistically,
  useOfferStore,
  type Category,
  type Condition,
  type DemandListing,
  type OfferItem,
} from '@snt/core';
import { CloseIcon } from '../icons';
import { Button } from '../primitives/Button';
import { OfferCard } from './OfferCard';
import { askLine, cashSetup, isPriceOffer } from './offerWords';
import styles from './Offers.module.css';

const MESSAGE_MAX = 200;

/** "Something else": an item described on the spot, not one of your listings. */
const DESCRIBE = 'describe';

/** Things of the current user's that could be put forward: what they sell,
 *  and what they have up for a swap. */
function ownItems(except: string): (OfferItem & { category: Category })[] {
  return liveListings
    .filter((listing) => listing.ownerId === CURRENT_USER_ID && listing.id !== except)
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
  listing: DemandListing;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const offers = useOfferStore((store) => store.offers);
  const mine = myOfferOn(offers, listing.id);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    // The page behind stays put while the sheet is open.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: close through React, so the opener hears about it.
        event.preventDefault();
        onClose();
      }}
      // A tap on the dimmed page behind, not on the sheet, closes it.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.sheetBody}>
        <div className={styles.sheetHead}>
          <h2 id={titleId} className={styles.sheetTitle}>
            {mine ? 'Your offer' : 'Make an offer'}
          </h2>
          <button
            type="button"
            className={styles.sheetClose}
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon size={18} weight={2.2} />
          </button>
        </div>

        {/* What is being answered, in a line. */}
        <p className={styles.ask}>{askLine(listing)}</p>

        {mine ? (
          <OfferCard offer={mine} view="made" />
        ) : (
          <OfferForm listing={listing} onSent={onClose} />
        )}
      </div>
    </dialog>,
    document.body,
  );
}

function OfferForm({
  listing,
  onSent,
}: {
  listing: DemandListing;
  onSent: () => void;
}) {
  const own = ownItems(listing.id);
  const setup = cashSetup(listing);
  const priced = isPriceOffer(listing);

  // Start on one of their own listings only if it is the kind of thing being
  // asked for — then there is nothing to type. Otherwise start on "describe
  // it": a laptop must never be one careless tap from answering a request
  // for a graphics card.
  const fits = own.find((candidate) => candidate.category === listing.wants.category);
  const [choice, setChoice] = useState(fits?.listingId ?? DESCRIBE);
  const [name, setName] = useState('');
  const [condition, setCondition] = useState<Condition | ''>('');
  const [cash, setCash] = useState(setup.amount);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const describing = choice === DESCRIBE;
  const picked = own.find((candidate) => candidate.listingId === choice);
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

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!item || !ready) return;
    setSending(true);
    try {
      await sendOfferOptimistically({
        listingId: listing.id,
        item,
        cashAmount: amount,
        cashFrom: amount > 0 ? setup.from : 'none',
        message: message.trim() || undefined,
      });
      toast.success('Offer sent');
      onSent();
    } catch {
      toast.error('Your offer was not sent. Try again.');
      setSending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={send}>
      <fieldset className={styles.group}>
        <legend className={styles.label}>What you are offering</legend>
        <div className={styles.choices}>
          {own.map((candidate) => (
            <label key={candidate.listingId} className={styles.choice}>
              <input
                type="radio"
                name="offer-item"
                checked={choice === candidate.listingId}
                onChange={() => setChoice(candidate.listingId ?? DESCRIBE)}
              />
              <span>
                <span className={styles.choiceName}>{candidate.name}</span>
                <span className={styles.choiceNote}>
                  Your listing
                  {candidate.condition
                    ? ` · ${CONDITION_LABELS[candidate.condition]}`
                    : ''}
                </span>
              </span>
            </label>
          ))}
          <label className={styles.choice}>
            <input
              type="radio"
              name="offer-item"
              checked={describing}
              onChange={() => setChoice(DESCRIBE)}
            />
            <span>
              <span className={styles.choiceName}>
                {own.length > 0 ? 'Something else' : 'Describe it'}
              </span>
              <span className={styles.choiceNote}>
                An item you have not listed
              </span>
            </span>
          </label>
        </div>

        {describing ? (
          <div className={styles.pair}>
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
            <label className={styles.field}>
              <span className={styles.label}>Condition</span>
              <select
                className={styles.input}
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value as Condition | '')
                }
              >
                <option value="">Not stated</option>
                {(Object.keys(CONDITION_LABELS) as Condition[]).map((value) => (
                  <option key={value} value={value}>
                    {CONDITION_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </fieldset>

      <label className={styles.field}>
        <span className={styles.label}>{setup.label}</span>
        <span className={styles.money}>
          <span aria-hidden>$</span>
          <input
            className={styles.input}
            inputMode="numeric"
            value={cash}
            onChange={(event) => setCash(event.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            maxLength={6}
          />
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          Message <span className={styles.optional}>(optional)</span>
        </span>
        <textarea
          className={[styles.input, styles.textarea].join(' ')}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Anything they should know — age, extras, where to meet"
          maxLength={MESSAGE_MAX}
          rows={3}
        />
      </label>

      <Button type="submit" size="lg" block disabled={!ready}>
        {sending ? 'Sending…' : 'Send offer'}
      </Button>
      <p className={styles.small}>
        Not binding. The owner compares offers side by side, and you settle
        the rest between you · meet in public, check the device first.
      </p>
    </form>
  );
}
