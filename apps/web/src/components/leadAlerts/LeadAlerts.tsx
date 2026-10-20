'use client';

/**
 * Lead alerts: the chip that says how they stand, and the sheet it opens to
 * change them (see LeadAlertSettings in @snt/core for the shape the backend
 * stores). On the Leads page, under the title; and on Shop profile.
 *
 * The chip: on (green, with where alerts go), paused (grey), or needing
 * setting up (amber: a WhatsApp number to confirm, or no category chosen).
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  CATEGORY_LABELS,
  activeAlertChannels,
  leadAlertStatus,
  useLeadAlertStore,
  type AlertMatch,
  type Category,
  type LeadAlertSettings,
} from '@snt/core';
import {
  Button,
  Chip,
  ChipWrap,
  Field,
  FieldRow,
  Segmented,
  Sheet,
  TickTile,
  useCloseSheet,
} from '@snt/ui';
import { BellIcon, ChevronRightIcon, InfoIcon, PauseIcon } from '@snt/ui/icons';
import styles from './LeadAlerts.module.css';

const CATEGORIES: Category[] = [
  'phones',
  'laptops',
  'desktops',
  'consoles',
  'parts',
  'accessories',
  'other',
];

const MATCHES: { value: AlertMatch; label: string }[] = [
  { value: 'stock', label: 'Items in my stock' },
  { value: 'categories', label: 'Whole categories' },
];

/** The status chip; opens the settings sheet. */
export function LeadAlertsChip() {
  const settings = useLeadAlertStore((state) => state.settings);
  const [open, setOpen] = useState(false);
  const status = leadAlertStatus(settings);
  const whatsapp = activeAlertChannels(settings).includes('whatsapp');

  return (
    <>
      <button
        type="button"
        className={[styles.chip, styles[status]].join(' ')}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {status === 'on' ? (
          <BellIcon size={14} />
        ) : status === 'paused' ? (
          <PauseIcon size={14} />
        ) : (
          <InfoIcon size={14} />
        )}
        <span>
          {status === 'on'
            ? `Lead alerts on · ${whatsapp ? 'WhatsApp' : 'In the app'}`
            : status === 'paused'
              ? 'Lead alerts paused'
              : 'Set up lead alerts'}
        </span>
        <ChevronRightIcon size={14} />
      </button>
      {open ? <LeadAlertsSheet onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function LeadAlertsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      title="Lead alerts"
      wide
      heading={
        // The title after its icon, on the app's pale tile.
        <span className={styles.heading}>
          <span className={styles.headingIcon}>
            <BellIcon size={18} />
          </span>
          <span className={styles.headingText}>
            <span className={styles.headingTitle}>Lead alerts</span>
            <span className={styles.headingNote}>
              Get an alert the moment someone wants something you are selling.
            </span>
          </span>
        </span>
      }
      onClose={onClose}
    >
      <SettingsForm />
    </Sheet>
  );
}

function SettingsForm() {
  const close = useCloseSheet();
  const saved = useLeadAlertStore((state) => state.settings);
  const save = useLeadAlertStore((state) => state.save);
  const [draft, setDraft] = useState<LeadAlertSettings>(saved);
  /** A code has been sent to the number, waiting to be typed in. */
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');

  const set = (change: Partial<LeadAlertSettings>) =>
    setDraft((current) => ({ ...current, ...change }));
  const setWhatsapp = (change: Partial<LeadAlertSettings['whatsapp']>) =>
    setDraft((current) => ({
      ...current,
      whatsapp: { ...current.whatsapp, ...change },
    }));
  const setQuiet = (change: Partial<LeadAlertSettings['quietHours']>) =>
    setDraft((current) => ({
      ...current,
      quietHours: { ...current.quietHours, ...change },
    }));
  const toggleCategory = (category: Category) =>
    set({
      categories: draft.categories.includes(category)
        ? draft.categories.filter((c) => c !== category)
        : [...draft.categories, category],
    });

  const whatsappOn = draft.whatsapp.on;
  /** A WhatsApp number on, but not yet proved. */
  const numberUnconfirmed = whatsappOn && !draft.whatsapp.confirmed;
  const needsCategory =
    draft.enabled &&
    draft.match === 'categories' &&
    draft.categories.length === 0;
  /** Something is shown missing, in red: no category, or an unconfirmed
      number. Save waits until it is put right. */
  const showsMissing = needsCategory || numberUnconfirmed;
  const status = leadAlertStatus(draft);

  return (
    <div className={styles.form}>
      {/* When the last one went, on its own line. */}
      {saved.lastSentLabel && saved.enabled ? (
        <p className={styles.last}>Last alert {saved.lastSentLabel}.</p>
      ) : null}

      {/* From a laptop up, two columns: whether and where on the left,
          what about on the right. */}
      <div className={styles.columns}>
        <div className={styles.column}>
          <TickTile
            checked={draft.enabled}
            onChange={(enabled) => set({ enabled })}
            label="Send me lead alerts"
            hint="Untick to pause them, for a holiday or a busy week. Leads still collect here."
          />

          {/* Where they go. */}
          <section className={styles.group}>
            <TickTile
              checked={draft.whatsapp.on}
              onChange={(on) => setWhatsapp({ on })}
              label="Send to WhatsApp"
              hint="Alerts always arrive here. Tick to send them to WhatsApp too."
            />
            {/* Always in place, greyed while WhatsApp is off, so the sheet
                keeps its shape as things are ticked. The number beside the
                code that proves it; under them, how it stands, and a button
                that sends the code, then confirms it, then says it is done. */}
            <div className={styles.whatsapp}>
              <FieldRow>
                <Field
                  label="WhatsApp number"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. +263 77 123 4567"
                  disabled={!whatsappOn}
                  value={draft.whatsapp.number}
                  onChange={(event) => {
                    // A new number has to be proved again.
                    setWhatsapp({
                      number: event.target.value,
                      confirmed: false,
                    });
                    setCodeSent(false);
                    setCode('');
                  }}
                />
                <Field
                  label="Code we sent"
                  inputMode="numeric"
                  placeholder="e.g. 482913"
                  maxLength={6}
                  disabled={
                    !whatsappOn || !codeSent || draft.whatsapp.confirmed
                  }
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, ''))
                  }
                />
              </FieldRow>
              <div className={styles.numberRow}>
                <p
                  className={[
                    styles.numberStatus,
                    !whatsappOn
                      ? styles.muted
                      : draft.whatsapp.confirmed
                        ? styles.confirmed
                        : styles.warn,
                  ].join(' ')}
                >
                  {!whatsappOn
                    ? 'WhatsApp is off.'
                    : draft.whatsapp.confirmed
                      ? 'Number confirmed.'
                      : 'Not confirmed. Nothing is sent to it yet.'}
                </p>
                <Button
                  size="sm"
                  variant={
                    codeSent && !draft.whatsapp.confirmed
                      ? 'primary'
                      : 'secondary'
                  }
                  className={styles.codeButton}
                  disabled={
                    !whatsappOn ||
                    draft.whatsapp.confirmed ||
                    (codeSent
                      ? code.length !== 6
                      : draft.whatsapp.number.replace(/\D/g, '').length < 9)
                  }
                  onClick={() => {
                    if (codeSent) {
                      setWhatsapp({ confirmed: true });
                      toast.success('Number confirmed.');
                    } else {
                      setCodeSent(true);
                      toast(
                        `Code sent to ${draft.whatsapp.number} on WhatsApp.`,
                      );
                    }
                  }}
                >
                  {draft.whatsapp.confirmed
                    ? 'Confirmed'
                    : codeSent
                      ? 'Confirm'
                      : 'Send a code'}
                </Button>
              </div>
            </div>
          </section>

          {/* When WhatsApp keeps quiet: greyed while it is off. */}
          <section className={styles.group}>
            <TickTile
              checked={draft.quietHours.on}
              onChange={(on) => setQuiet({ on })}
              disabled={!whatsappOn}
              label="Quiet hours"
              hint="No WhatsApp at night. Alerts still arrive here, and the message follows in the morning."
            />
            <FieldRow>
              <Field
                label="From"
                type="time"
                disabled={!whatsappOn || !draft.quietHours.on}
                value={draft.quietHours.from}
                onChange={(event) => setQuiet({ from: event.target.value })}
              />
              <Field
                label="Until"
                type="time"
                disabled={!whatsappOn || !draft.quietHours.on}
                value={draft.quietHours.to}
                onChange={(event) => setQuiet({ to: event.target.value })}
              />
            </FieldRow>
          </section>
        </div>

        <div className={styles.column}>
          {/* What they are about. */}
          <section className={styles.group}>
            <h3 className={styles.label}>Alert me about</h3>
            <Segmented<AlertMatch>
              label="Alert me about"
              options={MATCHES}
              value={draft.match}
              onChange={(match) => set({ match })}
            />
            {/* One line, whatever is chosen: what it means, or what is
                missing. */}
            <p className={needsCategory ? styles.warn : styles.note}>
              {draft.match === 'stock'
                ? 'Requests for items like the ones you have live.'
                : needsCategory
                  ? 'Choose at least one category below.'
                  : 'Any request in the categories you choose, to source to order.'}
            </p>
            {/* Always in place, greyed unless categories are chosen above. */}
            <ChipWrap label="Categories">
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  square
                  disabled={draft.match !== 'categories'}
                  selected={
                    draft.match === 'categories' &&
                    draft.categories.includes(category)
                  }
                  onClick={() => toggleCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                </Chip>
              ))}
            </ChipWrap>
            <TickTile
              checked={draft.includeSwaps}
              onChange={(includeSwaps) => set({ includeSwaps })}
              label="Include swaps"
              hint="Someone offering an item to swap, often with cash on top."
            />
            <Field
              label="Only budgets from"
              hint="Optional. Leave empty for any."
              inputMode="numeric"
              placeholder="e.g. $100"
              value={draft.minBudget === null ? '' : `$${draft.minBudget}`}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '');
                set({ minBudget: digits ? Number(digits) : null });
              }}
            />
          </section>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" size="lg" onClick={close}>
          Cancel
        </Button>
        {/* Not while something is shown missing in red. */}
        <Button
          size="lg"
          disabled={showsMissing}
          onClick={() => {
            save(draft);
            toast.success(
              status === 'paused'
                ? 'Lead alerts paused.'
                : status === 'setup'
                  ? 'Saved. Finish setting up to start alerts.'
                  : 'Lead alerts saved.',
            );
            close();
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
