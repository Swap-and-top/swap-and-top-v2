'use client';

/**
 * Boost a listing, or extend one already boosted, set as boosting a post
 * is on WhatsApp and Facebook, and paid through Paynow. One sheet, a step at
 * a time:
 *
 *  1. **Plan.** The item (already chosen when opened from it; otherwise the
 *     shop's live items, the first picked), a daily budget on a slider from
 *     $1 up with about how many people a day it reaches, and how long: a
 *     day, a week or a month. The total, and when it ends.
 *  2. **Pay.** What it costs, and one button: every payment goes through
 *     Paynow's own secure page, whatever the way to pay (EcoCash, OneMoney,
 *     Telecash, ZimSwitch, Visa, Mastercard), chosen there. One route means
 *     every payment is confirmed by Paynow, no payment details pass through
 *     the app, and people pay on a page they know.
 *  3. **On Paynow.** The page is open; the sheet waits for Paynow's result.
 *  4. **Done.** The payment's Paynow reference, and the sponsorship starts.
 *
 * Paynow is mocked for now: the steps are as they will be with the live
 * account (see docs/operations/payments-and-invoicing.md), each payment
 * "approved" after a moment.
 */

import { useEffect, useId, useState } from 'react';
import {
  SPONSOR_DURATIONS,
  SPONSOR_MAX_DAILY,
  SPONSOR_MIN_DAILY,
  currentShop,
  daysFromToday,
  dollars,
  getListing,
  reachPerDay,
  useShopStock,
  useSponsorStore,
  type Listing,
} from '@snt/core';
import {
  Button,
  Dropdown,
  ImagePlaceholder,
  Sheet,
  Spinner,
  listingPhoto,
  useCloseSheet,
} from '@snt/ui';
import { CheckIcon, MegaphoneIcon, ShieldCheckIcon } from '@snt/ui/icons';
import styles from './SponsorSheet.module.css';

/** The ways to pay on Paynow's page, named so people know before they go. */
const PAYNOW_WAYS = [
  'EcoCash',
  'OneMoney',
  'Telecash',
  'ZimSwitch',
  'Visa',
  'Mastercard',
];

type Step = 'plan' | 'pay' | 'approve' | 'done';

export function SponsorSheet({
  listingId,
  onClose,
}: {
  /** The item, when opened from it; none to choose one first. */
  listingId?: string;
  onClose: () => void;
}) {
  const running = useSponsorStore((state) => state.sponsorships);
  const extending = Boolean(
    listingId && running.some((s) => s.listingId === listingId),
  );
  const title = extending ? 'Extend boost' : 'Boost a listing';

  return (
    <Sheet
      title={title}
      heading={
        <span className={styles.heading}>
          <span className={styles.headingIcon}>
            <MegaphoneIcon size={18} weight={1.9} />
          </span>
          <span className={styles.headingText}>
            <span className={styles.headingTitle}>{title}</span>
            <span className={styles.headingNote}>
              A labelled Sponsored slot in the feed. The more a day, the more
              people see it.
            </span>
          </span>
        </span>
      }
      onClose={onClose}
    >
      <SponsorFlow listingId={listingId} extending={extending} />
    </Sheet>
  );
}

function SponsorFlow({
  listingId,
  extending,
}: {
  listingId?: string;
  extending: boolean;
}) {
  const close = useCloseSheet();
  const stock = useShopStock(currentShop.id);
  const sponsorships = useSponsorStore((state) => state.sponsorships);
  const start = useSponsorStore((state) => state.start);
  const extend = useSponsorStore((state) => state.extend);

  /** What can be sponsored: live items for sale not sponsored already. */
  const choices = stock.filter(
    (l) =>
      l.type === 'sale' &&
      l.status === 'live' &&
      !sponsorships.some((s) => s.listingId === l.id),
  );
  const [picked, setPicked] = useState(listingId ?? choices[0]?.id);
  const current = sponsorships.find((s) => s.listingId === picked);
  const [daily, setDaily] = useState(current?.dailyBudget ?? SPONSOR_MIN_DAILY);
  const [days, setDays] = useState<number>(SPONSOR_DURATIONS[0].days);
  const [step, setStep] = useState<Step>('plan');
  const [ref, setRef] = useState('');
  /** The day it was paid to run until, kept as it was at payment: once it
      starts, `current` is the new sponsorship and would count it twice. */
  const [paidUntil, setPaidUntil] = useState('');
  const whichLabel = useId();

  // A shop's stock item, or any listing opened from its own page: every
  // listing can be sponsored, a person's swap or Wanted listing too.
  const item = picked
    ? (stock.find((l) => l.id === picked) ?? getListing(picked))
    : undefined;
  const total = daily * days;
  const until = daysFromToday((current?.daysLeft ?? 0) + days);
  const [low, high] = reachPerDay(daily);

  // Paynow, mocked: its page comes back paid after a moment; then the
  // sponsorship starts. Live, this waits on Paynow's confirmation.
  useEffect(() => {
    if (step !== 'approve' || !item) return;
    const timer = window.setTimeout(() => {
      const reference = `PN ${4000 + Math.floor(Math.random() * 5999)} ${1000 + Math.floor(Math.random() * 8999)}`;
      setRef(reference);
      setPaidUntil(until);
      if (extending) extend(item.id, daily, days, reference);
      else start(item.id, daily, days, reference);
      setStep('done');
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [step, item, extending, extend, start, daily, days, until]);

  if (!item) {
    return (
      <p className={styles.note}>
        Everything live in your stock is boosted already, or there is
        nothing live to boost.
      </p>
    );
  }

  /* --- 4. done --------------------------------------------------------- */
  if (step === 'done') {
    return (
      <div className={styles.form}>
        <div className={styles.result}>
          <span className={styles.resultIcon}>
            <CheckIcon size={22} weight={2.6} />
          </span>
          <span className={styles.resultTitle}>Payment received</span>
          <span className={styles.resultText}>
            {item.title} is boosted until {paidUntil}, at {dollars(daily)}{' '}
            a day.
          </span>
          <span className={styles.resultRef}>Paynow reference {ref}</span>
        </div>
        <Button size="lg" block onClick={close}>
          Done
        </Button>
      </div>
    );
  }

  /* --- 3. approve ------------------------------------------------------ */
  if (step === 'approve') {
    return (
      <div className={styles.form}>
        <div className={styles.result}>
          <Spinner size={30} label="Waiting for the payment" />
          <span className={styles.resultTitle}>Finish on Paynow</span>
          <span className={styles.resultText}>
            Paynow&rsquo;s secure page is open. Choose how to pay there, and
            pay the {dollars(total)}. This updates once Paynow confirms it.
          </span>
        </div>
        <Button variant="secondary" size="lg" block onClick={() => setStep('pay')}>
          Cancel
        </Button>
      </div>
    );
  }

  /* --- 2. pay ---------------------------------------------------------- */
  if (step === 'pay') {
    return (
      <div className={styles.form}>
        <div className={styles.bill}>
          <span className={styles.billLine}>
            <span>{item.title}</span>
            <span>{dollars(total)}</span>
          </span>
          <span className={styles.billNote}>
            {days === 1 ? '1 day' : `${days} days`} at {dollars(daily)} a day,
            until {until}
          </span>
        </div>

        {/* Every way to pay is on Paynow's page: named here, chosen there. */}
        <div className={styles.group}>
          <span className={styles.label}>Pay on Paynow with</span>
          <div className={styles.ways}>
            {PAYNOW_WAYS.map((way) => (
              <span key={way} className={styles.way}>
                {way}
              </span>
            ))}
          </div>
          <p className={styles.note}>
            Paynow&rsquo;s secure page opens to choose how and pay. Your
            payment details go to Paynow only, never to Swap &amp; Top.
          </p>
        </div>

        <Button size="lg" block onClick={() => setStep('approve')}>
          Pay {dollars(total)} with Paynow
        </Button>
        <div className={styles.secure}>
          <ShieldCheckIcon size={15} />
          Paid securely through Paynow
        </div>
        <Button variant="secondary" size="lg" block onClick={() => setStep('plan')}>
          Back
        </Button>
      </div>
    );
  }

  /* --- 1. plan --------------------------------------------------------- */
  return (
    <div className={styles.form}>
      {listingId ? (
        <ItemRow listing={item} />
      ) : (
        // Every listing that can be boosted, in a dropdown so a long stock
        // stays one line; the one chosen shown under it.
        <div className={styles.group}>
          <span id={whichLabel} className={styles.label}>
            Which listing
          </span>
          <Dropdown<string>
            labelledBy={whichLabel}
            value={picked}
            onChange={setPicked}
            options={choices.map((l) => ({
              value: l.id,
              label: l.title,
              note: l.type === 'sale' ? `$${l.price}` : undefined,
            }))}
          />
          <ItemRow listing={item} />
        </div>
      )}

      {/* The daily budget: a slider from $1, the amount large above it. */}
      <div className={styles.group}>
        <span className={styles.label}>Daily budget</span>
        <span className={styles.budget}>
          {dollars(daily)} <span className={styles.budgetUnit}>a day</span>
        </span>
        <input
          type="range"
          className={styles.slider}
          min={SPONSOR_MIN_DAILY}
          max={SPONSOR_MAX_DAILY}
          step={1}
          value={daily}
          onChange={(event) => setDaily(Number(event.target.value))}
          aria-label="Daily budget, in dollars"
          style={
            {
              '--fill': `${((daily - SPONSOR_MIN_DAILY) / (SPONSOR_MAX_DAILY - SPONSOR_MIN_DAILY)) * 100}%`,
            } as React.CSSProperties
          }
        />
        <span className={styles.note}>
          About {low.toLocaleString('en-US')} to{' '}
          {high.toLocaleString('en-US')} people a day
        </span>
      </div>

      <fieldset className={styles.group}>
        <legend className={styles.label}>How long</legend>
        <div className={styles.weeks}>
          {SPONSOR_DURATIONS.map((d) => (
            <label key={d.days} className={styles.tile}>
              <input
                type="radio"
                name="sponsor-days"
                checked={days === d.days}
                onChange={() => setDays(d.days)}
              />
              <span className={styles.tileText}>
                <span>{d.label}</span>
                <span className={styles.tilePrice}>
                  {dollars(daily * d.days)}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className={styles.note}>
          {extending
            ? `Runs until ${until} instead of ${current?.endsLabel}.`
            : `Runs from today until ${until}.`}
        </p>
      </fieldset>

      <Button size="lg" block onClick={() => setStep('pay')}>
        Continue to pay {dollars(total)}
      </Button>
    </div>
  );
}

/** An item in brief: its photo, name and price. */
function ItemRow({ listing }: { listing: Listing }) {
  return (
    <span className={styles.item}>
      <ImagePlaceholder
        src={listingPhoto(listing)}
        height={44}
        width={44}
        small
        className={styles.thumb}
      />
      <span className={styles.itemText}>
        <span className={styles.itemName}>{listing.title}</span>
        <span className={styles.itemPrice}>
          {listing.type === 'sale'
            ? `$${listing.price}`
            : listing.type === 'swap'
              ? 'Swap'
              : listing.type === 'request'
                ? 'Wanted'
                : ''}
        </span>
      </span>
    </span>
  );
}
