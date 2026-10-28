'use client';

/**
 * Buying a store pass (docs/product/accounts-and-stores.md): a day for $1, a
 * week for $5 or a month for $15. While one runs the store has no listing
 * limit, the Store console and lead alerts; bought while one runs, it starts
 * where that ends. Opened from Me, beside each store you own, and from the
 * listing limit message when a store hits it.
 *
 * A test payment until Paynow is set up: the API records it as paid at once.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '@snt/core';
import { Button, Sheet, useCloseSheet } from '@snt/ui';
import { refreshStorePass } from '@/lib/refresh';
import { apiAsViewer, fetchViewer, supabase } from '@/lib/supabase';
import styles from './sponsor/SponsorSheet.module.css';

type Kind = 'day' | 'week' | 'month';

const PASSES: { kind: Kind; label: string; price: number }[] = [
  { kind: 'day', label: '1 day', price: 1 },
  { kind: 'week', label: '1 week', price: 5 },
  { kind: 'month', label: '1 month', price: 15 },
];

export interface PassStore {
  id: string;
  slug: string;
  name: string;
  /** "10 Nov", while a pass runs. */
  paidUntil?: string;
}

export function StorePassSheet({
  store,
  onClose,
}: {
  store: PassStore;
  onClose: () => void;
}) {
  return (
    <Sheet
      narrow
      title={store.paidUntil ? 'Extend store pass' : 'Get a store pass'}
      onClose={onClose}
    >
      <PassForm store={store} />
    </Sheet>
  );
}

function PassForm({ store }: { store: PassStore }) {
  const close = useCloseSheet();
  const [kind, setKind] = useState<Kind>('day');
  const [busy, setBusy] = useState(false);
  const price = PASSES.find((pass) => pass.kind === kind)!.price;

  async function pay() {
    setBusy(true);
    const { data, error } = await apiAsViewer<{ endsLabel: string; restored: number }>(
      `/stores/${store.id}/passes`,
      { method: 'POST', body: { kind } },
    );
    if (error || !data) {
      setBusy(false);
      toast.error(error ?? 'We could not take the payment. Try again in a minute.');
      return;
    }
    // Who they are now carries the new end date, for Me and posting.
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (token) useSessionStore.setState({ viewer: await fetchViewer(token) });
    // Listings the last lapse paused are live again: the feed shows them.
    await refreshStorePass(store.slug);
    toast.success(
      data.restored > 0
        ? `Paid until ${data.endsLabel}. ${data.restored} paused ${data.restored === 1 ? 'listing is' : 'listings are'} live again.`
        : `Paid until ${data.endsLabel}.`,
    );
    close();
  }

  return (
    <div className={styles.form}>
      <p className={styles.note}>
        {store.paidUntil
          ? `${store.name} is paid until ${store.paidUntil}. A new pass starts when that ends.`
          : `${store.name} is a free store, with up to 15 live listings. A pass gives it no listing limit, the Store console and lead alerts.`}
      </p>

      <fieldset className={styles.group}>
        <legend className={styles.label}>How long</legend>
        <div className={styles.weeks}>
          {PASSES.map((pass) => (
            <label key={pass.kind} className={styles.tile}>
              <input
                type="radio"
                name="pass-kind"
                checked={kind === pass.kind}
                onChange={() => setKind(pass.kind)}
              />
              <span className={styles.tileText}>
                <span>{pass.label}</span>
                <span className={styles.tilePrice}>${pass.price}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button size="lg" block loading={busy} onClick={pay}>
        Pay ${price}
      </Button>
      <p className={styles.note}>
        A test payment while Paynow is being set up. Nothing is charged.
      </p>
    </div>
  );
}
