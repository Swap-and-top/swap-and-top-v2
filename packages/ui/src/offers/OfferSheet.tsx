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
  liveListings,
  myOfferOn,
  requireSignIn,
  sendOfferOptimistically,
  useOfferStore,
  useViewerId,
  type Category,
  type Condition,
  type DemandListing,
  type OfferItem,
} from '@snt/core';
import { BinocularsIcon, CashHandIcon } from '../icons';
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
  userId: string | undefined,
  except: string,
): (OfferItem & { category: Category })[] {
  if (!userId) return [];
  return liveListings
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
  listing: DemandListing;
  onClose: () => void;
}) {
  const offers = useOfferStore((store) => store.offers);
  const mine = myOfferOn(offers, listing.id, useViewerId());
  const ask = askParts(listing);

  return (
    <Sheet
      title={`Wanted item: ${ask.item}`}
      // What is being answered heads the sheet, first and largest: the item
      // wanted, then its terms. Everything under it is what you offer for it.
      heading={
        <div className={styles.ask}>
          {/* Marked exactly as on a Wanted card in the feed. */}
          <span className={styles.askLabel}>
            <BinocularsIcon size={16} weight={2} filled />
            Wanted
          </span>
          {/* The item, with its budget or terms beside it. */}
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
            <CashHandIcon size={17} />
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

function OfferForm({ listing }: { listing: DemandListing }) {
  // Sent, the sheet sinks away like any other close.
  const onSent = useCloseSheet();
  const own = ownItems(useViewerId(), listing.id);
  const setup = cashSetup(listing);
  const priced = isPriceOffer(listing);

  // Start on one of their own listings only if it is the kind of thing being
  // asked for — then there is nothing to type. Otherwise start on "describe
  // it": a laptop must never be one careless tap from answering a request
  // for a graphics card.
  const fits = own.find((candidate) => candidate.category === listing.wants.category);
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
      {/* Marked like the WANTED label above it: a filled hand held out,
          offering something, in the blue of what is yours. */}
      <h3 className={styles.formTitle}>
        <CashHandIcon size={17} />
        Make an offer
      </h3>

      <fieldset className={styles.group}>
        <legend className={styles.label}>What you are offering</legend>
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
              <span className={styles.label}>{setup.label}</span>
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
              <span className={styles.label}>{setup.label}</span>
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
        <textarea
          className={[styles.input, styles.textarea].join(' ')}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Any extra info"
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
