'use client';

/**
 * Lead alerts: the chip that says how they stand, and the sheet it opens to
 * change them (see LeadAlertSettings in @snt/core). On the Leads page, under
 * the title; and on Store profile. Saved for the store the console is open
 * for (GET and PUT /api/stores/{id}/lead-settings), through TanStack Query.
 * "Show me leads for" decides the Leads list as well as the alerts: items
 * like the store's stock, or whole categories it chooses.
 *
 * The chip: on (green, with where alerts go), paused (grey), or needing
 * setting up (amber: a WhatsApp number to confirm, or no category chosen).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  CATEGORY_LABELS,
  activeAlertChannels,
  leadAlertStatus,
  mockPromotionProducts,
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
  useConsoleTarget,
} from '@snt/ui';
import {
  BellIcon,
  InfoIcon,
  PauseIcon,
  SettingsIcon,
} from '@snt/ui/icons';
import { apiGet, apiSend } from '@/lib/query';
import styles from './LeadAlerts.module.css';

/** The store's settings, as the API keeps them; when the last alert went
    is not kept yet, as none are sent. */
type Saved = Omit<LeadAlertSettings, 'lastSentLabel'>;

const settingsKey = (storeId: string) => ['store', storeId, 'leadSettings'] as const;

/** The lead settings of the store the console is open for. */
export function useLeadSettings() {
  const store = useConsoleTarget();
  const storeId = store?.id ?? '';
  const query = useQuery({
    queryKey: settingsKey(storeId),
    queryFn: () =>
      apiGet<Saved>(`/stores/${encodeURIComponent(storeId)}/lead-settings`).then(
        (saved): LeadAlertSettings => ({ ...saved, lastSentLabel: null }),
      ),
    enabled: Boolean(store),
    meta: { toast: true },
  });
  return { storeId, settings: query.data };
}

/** The lead alerts subscription: its price and renewal. */
const alertsPlan = mockPromotionProducts.find((p) => p.id === 'lead-alerts');

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

/** The status chip, and beside it a plain button to the settings: the
    chip only says how alerts stand; the button opens the settings sheet. */
export function LeadAlertsChip() {
  const { settings } = useLeadSettings();
  const [open, setOpen] = useState(false);
  const status = settings ? leadAlertStatus(settings) : 'on';
  const whatsapp = settings ? activeAlertChannels(settings).includes('whatsapp') : false;

  return (
    <span className={styles.chipRow}>
      {/* Hidden until the settings come, so it never says the wrong thing. */}
      <span className={[styles.chip, styles[status]].join(' ')} style={settings ? undefined : { visibility: 'hidden' }}>
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
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <SettingsIcon size={16} />
        Lead settings
      </Button>
      {open && settings ? <LeadAlertsSheet onClose={() => setOpen(false)} /> : null}
    </span>
  );
}

export function LeadAlertsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      title="Lead settings"
      wide
      heading={
        // The title after its icon, on the app's pale tile.
        <span className={styles.heading}>
          <span className={styles.headingIcon}>
            <SettingsIcon size={18} />
          </span>
          <span className={styles.headingText}>
            <span className={styles.headingTitle}>Lead settings</span>
            <span className={styles.headingNote}>
              Which requests show in your Leads, and how we alert you about them.
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
  const { storeId, settings } = useLeadSettings();
  return settings ? <SettingsFormFor storeId={storeId} saved={settings} /> : null;
}

function SettingsFormFor({ storeId, saved }: { storeId: string; saved: LeadAlertSettings }) {
  const close = useCloseSheet();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<LeadAlertSettings>(saved);
  const save = useMutation({
    mutationFn: ({ lastSentLabel: _, ...settings }: LeadAlertSettings) =>
      apiSend<Saved>(`/stores/${encodeURIComponent(storeId)}/lead-settings`, 'PUT', settings),
    onSuccess: (next) => {
      queryClient.setQueryData(settingsKey(storeId), { ...next, lastSentLabel: null });
      // What counts as a lead may have changed: the list, and its badge.
      void queryClient.invalidateQueries({ queryKey: ['store', storeId, 'leads'] });
      const status = leadAlertStatus({ ...next, lastSentLabel: null });
      toast.success(
        status === 'paused'
          ? 'Saved. Lead alerts paused.'
          : status === 'setup'
            ? 'Saved. Finish setting up to start alerts.'
            : 'Lead settings saved.',
      );
      close();
    },
    onError: (error) => toast.error(error.message),
  });
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

  return (
    <div className={styles.form}>
    {/* Which requests are leads: the store's own choice, deciding its
        Leads list, and the alerts below follow it. */}
    <section className={styles.group}>
          <h3 className={styles.label}>Show me leads for</h3>
          <Segmented<AlertMatch>
            label="Show me leads for"
            options={MATCHES}
            value={draft.match}
            onChange={(match) => set({ match })}
          />
          {/* One line, whatever is chosen: what it means, or what is
              missing. */}
          <p className={needsCategory ? styles.warn : styles.note}>
            {draft.match === 'stock'
              ? 'Requests for items like the ones you have live. Your Leads and your alerts both follow this.'
              : needsCategory
                ? 'Choose at least one category below.'
                : 'Any request in the categories you choose, even with nothing in stock, to source to order. Your Leads and your alerts both follow this.'}
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
      </section>

      {/* Lead alerts: a part of the settings, whether and how the store is
          told about a new lead. */}
      <section className={styles.group}>
        <h3 className={styles.sectionTitle}>Lead alerts</h3>
        {alertsPlan ? (
          <p className={styles.headingPlan}>
            {alertsPlan.priceLabel}
            {alertsPlan.detail ? ` · ${alertsPlan.detail}` : ''}
          </p>
        ) : null}
        {/* When the last one went, on its own line. */}
        {saved.lastSentLabel && saved.enabled ? (
          <p className={styles.last}>Last alert {saved.lastSentLabel}.</p>
        ) : null}
      </section>

      {/* From a laptop up, two columns: whether and where on the left,
          when and which on the right. */}
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

        </div>

        <div className={styles.column}>
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
          <section className={styles.group}>
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
          loading={save.isPending}
          onClick={() => save.mutate(draft)}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
