'use client';

/**
 * Reporting a listing, or a person after a deal check
 * (docs/features/moderation.md, "Reporting"): one reason from a short list,
 * starting on the most common, and an optional note, then Send report
 * (POST /api/reports). Trust and safety see it in the Staff console; the
 * person reported is never told who sent it.
 */

import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
  LISTING_REPORT_REASONS,
  PERSON_REPORT_REASONS,
  REPORT_REASON_LABELS,
  requireSignIn,
  type ReportReason,
} from '@snt/core';
import { Button, Dropdown, Sheet, Stack } from '@snt/ui';
import { apiAsViewer } from '@/lib/supabase';
import styles from './ReportSheet.module.css';

export function ReportSheet({
  listingId,
  personId,
  name,
  onClose,
}: {
  /** The listing reported; its poster is the person reported. */
  listingId?: string;
  /** Or the person reported, from a deal check. */
  personId?: string;
  /** The listing's title or the person's name, for the sheet's title. */
  name: string;
  onClose: () => void;
}) {
  const reasons = listingId ? LISTING_REPORT_REASONS : PERSON_REPORT_REASONS;
  const [reason, setReason] = useState<ReportReason>(reasons[0]!);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const reasonLabel = useId();

  async function send() {
    setBusy(true);
    const { error } = await apiAsViewer('/reports', {
      method: 'POST',
      body: { listingId, personId, reason, details: details.trim() || undefined },
    });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Report sent. Our team will look at it.');
    onClose();
  }

  return (
    <Sheet narrow title={listingId ? 'Report this listing' : `Report ${name}`} onClose={onClose}>
      <Stack gap={5}>
        <p className={styles.lead}>
          {listingId ? `${name}. ` : ''}Our team looks at every report. The person you report is never told who sent it.
        </p>
        <div className={styles.field}>
          <span id={reasonLabel} className={styles.label}>
            What is wrong
          </span>
          <Dropdown
            value={reason}
            options={reasons.map((value) => ({ value, label: REPORT_REASON_LABELS[value] }))}
            onChange={setReason}
            labelledBy={reasonLabel}
          />
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Anything else (optional)</span>
          <textarea
            className={styles.textarea}
            rows={3}
            maxLength={500}
            placeholder="e.g. The photos are of a different phone."
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
        </label>
        <Button size="lg" block loading={busy} onClick={() => void send()}>
          Send report
        </Button>
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}

/**
 * The Report button's wiring on an opened listing: none on your own or on
 * a buyer preview; a sign in first for a guest; then the sheet.
 */
export function useListingReport(listingId: string, title: string, hidden: boolean) {
  const [open, setOpen] = useState(false);
  return {
    onReport: hidden ? undefined : () => requireSignIn('Sign in to report a listing.', () => setOpen(true)),
    sheet: open ? <ReportSheet listingId={listingId} name={title} onClose={() => setOpen(false)} /> : null,
  };
}
