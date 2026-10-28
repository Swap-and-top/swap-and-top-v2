'use client';

/**
 * Verified store, on Edit store details: where the store stands, and the
 * owner's request (GET and POST /api/stores/{id}/verification). The owner
 * says what stands behind the store and gives its registration or licence
 * number; our team calls to see the documents, and an admin verifies it.
 * Changing the store's name pauses the badge, and the owner asks again.
 */

import { useEffect, useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button, Dropdown, Field, Panel, Stack, VerifiedStoreBadge } from '@snt/ui';
import { apiAsViewer } from '@/lib/supabase';
import styles from './page.module.css';

type Kind = 'registered' | 'informal';

interface Standing {
  verified: boolean;
  request: {
    state: 'pending' | 'approved' | 'declined';
    kind: Kind;
    reference: string;
    note?: string;
    askedLabel: string;
  } | null;
}

const KINDS: { value: Kind; label: string }[] = [
  { value: 'registered', label: 'Registered business' },
  { value: 'informal', label: 'Informal trader' },
];

export function VerifyPanel({ storeId, phone }: { storeId: string; phone?: string }) {
  const kindLabel = useId();
  const [standing, setStanding] = useState<Standing | null>(null);
  const [kind, setKind] = useState<Kind>('registered');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let gone = false;
    void apiAsViewer<Standing>(`/stores/${encodeURIComponent(storeId)}/verification`, {
      method: 'GET',
    }).then(({ data }) => {
      if (!gone && data) setStanding(data);
    });
    return () => {
      gone = true;
    };
  }, [storeId]);

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (reference.trim().length < 2) {
      toast.error('Enter the registration or licence number.');
      return;
    }
    setBusy(true);
    const { data, error } = await apiAsViewer<Standing>(
      `/stores/${encodeURIComponent(storeId)}/verification`,
      { method: 'POST', body: { kind, reference: reference.trim() } },
    );
    setBusy(false);
    if (error || !data) {
      toast.error(error ?? 'That did not go through. Try again.');
      return;
    }
    setStanding(data);
    toast.success('Request sent. Our team will call you.');
  }

  if (!standing) return null;
  const { verified, request } = standing;

  return (
    <Panel padded>
      <Stack gap={4}>
        <h2 className={styles.sectionTitle}>Verified store</h2>
        {verified ? (
          <>
            <VerifiedStoreBadge size="md" label="Verified store" />
            <p className={styles.lead}>
              Buyers see that a real business stands behind your store. Changing its name
              pauses the badge until we check again.
            </p>
          </>
        ) : request?.state === 'pending' ? (
          <p className={styles.lead}>
            Your request from {request.askedLabel} is with our team. We will call you
            {phone ? ` on ${phone}` : ''} to see your documents and arrange a short video
            call or visit.
          </p>
        ) : (
          <form onSubmit={ask}>
            <Stack gap={5}>
              <p className={styles.lead}>
                {request?.state === 'declined'
                  ? `We could not verify it last time: ${request.note ?? 'no reason given'}. You can ask again.`
                  : request?.state === 'approved'
                    ? 'The badge was paused when the store’s name changed. Ask again to have it back.'
                    : 'Show buyers a real business stands behind your store. Tell us what you have, and our team will call you to see your documents.'}
              </p>
              <div className={styles.town}>
                <span id={kindLabel} className={styles.label}>
                  Your business
                </span>
                <Dropdown value={kind} options={KINDS} onChange={setKind} labelledBy={kindLabel} />
              </div>
              <Field
                label={kind === 'registered' ? 'Registration number' : 'Council or market licence number'}
                placeholder={kind === 'registered' ? 'e.g. 12345/2019' : 'e.g. HCC 004512'}
                maxLength={60}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
              <Button type="submit" size="lg" block loading={busy}>
                Ask to be verified
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </Panel>
  );
}
